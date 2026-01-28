from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..black_scholes import calculate_call_put
from ..database import get_db

router = APIRouter(prefix="/api", tags=["calculations"])


@router.post(
    "/calculate",
    response_model=schemas.CalculationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_calculation(
    payload: schemas.CalculationCreate, db: Session = Depends(get_db)
) -> schemas.CalculationRead:
    try:
        call_price, put_price, d1, d2 = calculate_call_put(
            s0=payload.s0,
            x=payload.x,
            t=payload.t,
            r=payload.r,
            d=payload.d,
            v=payload.v,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    calc = models.Calculation(
        s0=payload.s0,
        x=payload.x,
        t=payload.t,
        r=payload.r,
        d=payload.d,
        v=payload.v,
        call_price=call_price,
        put_price=put_price,
    )
    db.add(calc)
    db.commit()
    db.refresh(calc)

    return schemas.CalculationRead(
        id=calc.id,
        s0=calc.s0,
        x=calc.x,
        t=calc.t,
        r=calc.r,
        d=calc.d,
        v=calc.v,
        call_price=calc.call_price,
        put_price=calc.put_price,
        d1=d1,
        d2=d2,
        created_at=calc.created_at,
    )


@router.get("/history", response_model=List[schemas.CalculationSummary])
def list_calculations(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
) -> List[schemas.CalculationSummary]:
    calculations = (
        db.query(models.Calculation)
        .order_by(models.Calculation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return calculations


@router.get("/history/count")
def get_history_count(db: Session = Depends(get_db)):
    count = db.query(models.Calculation).count()
    return {"total": count}


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def delete_calculations(
    payload: schemas.HistoryDeleteRequest, db: Session = Depends(get_db)
) -> None:
    """
    Delete one or more calculations by ID.
    """
    if not payload.ids:
        return

    db.query(models.Calculation).filter(models.Calculation.id.in_(payload.ids)).delete(
        synchronize_session=False
    )
    db.commit()


@router.get(
    "/history/{calculation_id}",
    response_model=schemas.CalculationRead,
)
def get_calculation(
    calculation_id: int, db: Session = Depends(get_db)
) -> schemas.CalculationRead:
    calc = (
        db.query(models.Calculation)
        .filter(models.Calculation.id == calculation_id)
        .first()
    )
    if not calc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found.",
        )

    # Recompute d1 and d2 for completeness; prices are persisted
    call_price, put_price, d1, d2 = calculate_call_put(
        s0=calc.s0,
        x=calc.x,
        t=calc.t,
        r=calc.r,
        d=calc.d,
        v=calc.v,
    )
    # Use stored prices (for consistency with DB), but expose d1/d2 from recomputation
    return schemas.CalculationRead(
        id=calc.id,
        s0=calc.s0,
        x=calc.x,
        t=calc.t,
        r=calc.r,
        d=calc.d,
        v=calc.v,
        call_price=calc.call_price,
        put_price=calc.put_price,
        d1=d1,
        d2=d2,
        created_at=calc.created_at,
    )


@router.post(
    "/calculate/batch",
    response_model=schemas.BatchCalculationResponse,
    status_code=status.HTTP_200_OK,
)
def batch_calculate(
    payload: schemas.BatchCalculationRequest, db: Session = Depends(get_db)
) -> schemas.BatchCalculationResponse:
    """
    Calculate Black-Scholes prices for multiple parameter sets at once.
    Returns all successful calculations and counts of successful/failed attempts.
    """
    results: List[schemas.CalculationRead] = []
    successful = 0
    failed = 0

    for calc_input in payload.calculations:
        try:
            call_price, put_price, d1, d2 = calculate_call_put(
                s0=calc_input.s0,
                x=calc_input.x,
                t=calc_input.t,
                r=calc_input.r,
                d=calc_input.d,
                v=calc_input.v,
            )

            calc = models.Calculation(
                s0=calc_input.s0,
                x=calc_input.x,
                t=calc_input.t,
                r=calc_input.r,
                d=calc_input.d,
                v=calc_input.v,
                call_price=call_price,
                put_price=put_price,
            )
            db.add(calc)
            db.flush()  # Get ID without committing

            result = schemas.CalculationRead(
                id=calc.id,
                s0=calc.s0,
                x=calc.x,
                t=calc.t,
                r=calc.r,
                d=calc.d,
                v=calc.v,
                call_price=calc.call_price,
                put_price=calc.put_price,
                d1=d1,
                d2=d2,
                created_at=calc.created_at,
            )
            results.append(result)
            successful += 1
        except (ValueError, Exception) as exc:
            failed += 1
            # Continue processing other calculations even if one fails
            continue

    # Commit all successful calculations at once
    db.commit()

    return schemas.BatchCalculationResponse(
        results=results,
        total=len(payload.calculations),
        successful=successful,
        failed=failed,
    )

