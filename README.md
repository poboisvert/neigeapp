# info-neige-MTL

A quick example of info-neige Montreal, Canada

## Description

FastAPI application to retrieve Montreal snow removal planning data from the PlanifNeige API. The API prints results to the console instead of storing them in a database.

## Virtual Environment Setup

### Quick Setup (Recommended)

Run the setup script to automatically create the virtual environment and install dependencies:

```bash
./setup.sh
```

This will:

- Create the virtual environment
- Activate it
- Upgrade pip
- Install all dependencies

### Manual Setup

#### 1. Create Virtual Environment

```bash
python3 -m venv venv
```

#### 2. Activate Virtual Environment

**On macOS/Linux:**

```bash
source venv/bin/activate
```

**On Windows:**

```bash
venv\Scripts\activate
```

### 3. Install Dependencies

Once the virtual environment is activated, install the required packages:

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

The `.env` file is already created with your credentials. If you need to update it, edit the `.env` file:

```
UserName=pierre Olivier
UserEmail=pob944@hotmail.com
TokenString=your_token_here
```

Alternatively, you can set the token as an environment variable:

```bash
export PLANIF_NEIGE_TOKEN=your_token_here
```

### 5. Deactivate Virtual Environment (when done)

```bash
deactivate
```

## Running the API

**Make sure your virtual environment is activated first!**

Start the server:

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /planifications?from_date=YYYY-MM-DDTHH:MM:SS` - Get all planifications since a date (defaults to 60 days ago)
- `GET /planifications/{street_side_id}` - Get planification for a specific street side ID

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Example Usage

```bash
# Get all planifications
curl http://localhost:8000/planifications

# Get planifications since a specific date
curl "http://localhost:8000/planifications?from_date=2024-01-01T00:00:00"

# Get planification for a specific street side
curl http://localhost:8000/planifications/12345
```

All results are printed to the console when retrieved.
