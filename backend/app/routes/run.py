from fastapi import APIRouter, Depends, status
from app.schemas.run import RunRequest, RunResponse
from app.services.judge0_service import get_judge0_service
from app.services.language_mapper import get_language_id
from app.utils.rate_limit import RateLimit

router = APIRouter()

# Apply rate limiting to /run: e.g., max 5 execution runs per 60 seconds per IP
@router.post(
    "/run", 
    response_model=RunResponse, 
    status_code=status.HTTP_200_OK, 
    dependencies=[Depends(RateLimit(limit=5, window_seconds=60))]
)
def run_code(run_in: RunRequest):
    # 1. Validate and map language
    language_id = get_language_id(run_in.language)
    
    # 2. Get Judge0 service
    judge0 = get_judge0_service()
    
    # 3. Execute code via Judge0
    if run_in.language.strip().lower() == "sql":
        exec_code = (run_in.input or "") + "\n" + run_in.code
        stdin_data = ""
    else:
        exec_code = run_in.code
        stdin_data = run_in.input
        
    result = judge0.execute_code(exec_code, language_id, stdin_data)
    
    # 4. Map and return response
    status_desc = result["status"]["description"]
    
    # Combine stderr and compile_output for visibility
    combined_err = ""
    if result["stderr"]:
        combined_err = result["stderr"]
    elif result["compile_output"]:
        combined_err = result["compile_output"]
        
    return RunResponse(
        status=status_desc,
        stdout=result["stdout"],
        stderr=combined_err,
        execution_time=str(result["time"]),
        memory=int(result["memory"])
    )
