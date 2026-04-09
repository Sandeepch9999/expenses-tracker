# SpendSmart — Smart Student Expense Tracker

A full-stack student expense tracking application with a premium Apple iOS-style liquid glass (glassmorphism) UI.

---

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | Vanilla HTML5, CSS3, JavaScript |
| Backend  | Java 17 + Spring Boot 3.2   |
| Database | MySQL 8                     |
| Build    | Maven                       |
| Charts   | Chart.js 4                  |

---

## Project Structure

```
project/
├── backend/
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/expensetracker/
│           │   ├── ExpenseTrackerApplication.java
│           │   ├── config/
│           │   │   └── CorsConfig.java
│           │   ├── controller/
│           │   │   └── ExpenseController.java
│           │   ├── entity/
│           │   │   └── Expense.java
│           │   ├── repository/
│           │   │   └── ExpenseRepository.java
│           │   └── service/
│           │       └── ExpenseService.java
│           └── resources/
│               ├── application.properties
│               └── schema.sql
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Prerequisites

- Java 17 or later
- Maven 3.8+
- MySQL 8.0+
- Any modern web browser

---

## Database Setup

### 1. Start MySQL and create the database

```sql
CREATE DATABASE IF NOT EXISTS expense_tracker;
```

Or run the provided schema file:

```bash
mysql -u root -p < backend/src/main/resources/schema.sql
```

### 2. Update database credentials

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/expense_tracker?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD_HERE
```

Replace `YOUR_PASSWORD_HERE` with your actual MySQL root password.

---

## Running the Backend (Spring Boot)

### Option A — Maven wrapper

```bash
cd backend
./mvnw spring-boot:run
```

### Option B — Maven installed globally

```bash
cd backend
mvn spring-boot:run
```

### Option C — Build and run JAR

```bash
cd backend
mvn clean package -DskipTests
java -jar target/expense-tracker-0.0.1-SNAPSHOT.jar
```

The server starts at **http://localhost:8080**

---

## Running the Frontend

The frontend is plain HTML/CSS/JS — no build step needed.

### Option A — VS Code Live Server

1. Open the `frontend/` folder in VS Code
2. Right-click `index.html` → **Open with Live Server**

### Option B — Python HTTP server

```bash
cd frontend
python3 -m http.server 5500
```

Then open **http://localhost:5500** in your browser.

### Option C — Any static file server

Serve the `frontend/` directory using any web server of your choice.

> **Important:** The frontend connects to `http://localhost:8080/expenses` — make sure the Spring Boot backend is running before opening the app.

---

## REST API Reference

Base URL: `http://localhost:8080`

### Add Expense

```
POST /expenses
Content-Type: application/json

{
  "amount": 12.50,
  "category": "Food",
  "description": "Lunch at campus cafe",
  "date": "2025-04-09"
}
```

**Response:** `201 Created` with the saved expense object

### Get All Expenses

```
GET /expenses
```

**Response:** `200 OK` — JSON array of all expenses, ordered by date descending

### Delete Expense

```
DELETE /expenses/{id}
```

**Response:** `200 OK` — `{ "message": "Expense deleted successfully" }`

---

## Expense Categories

| Category      | Use Case                  |
|---------------|---------------------------|
| Food          | Meals, groceries, snacks  |
| Housing       | Rent, dorm fees           |
| Transport     | Bus, metro, ride-share    |
| Education     | Books, tuition, courses   |
| Healthcare    | Medicine, doctor visits   |
| Entertainment | Movies, games, events     |
| Shopping      | Clothes, electronics      |
| Utilities     | Internet, phone, electricity |
| Other         | Miscellaneous             |

---

## Features

- Add, view, and delete expenses
- Dashboard with total spending overview
- Category-wise breakdown with a doughnut chart (Chart.js)
- Live spending insights (e.g., "You spent 40% on Food")
- Monthly spend summary
- Filter transactions by category
- Responsive design for mobile and desktop
- Premium iOS liquid glass (glassmorphism) UI with:
  - Backdrop blur & frosted glass cards
  - Gradient ambient background with animated orbs
  - Glossy reflection via CSS `::before`
  - Smooth hover transitions and micro-interactions

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot connect to server` in browser | Ensure Spring Boot is running on port 8080 |
| `Access denied for user 'root'` | Update password in `application.properties` |
| `Unknown database 'expense_tracker'` | Run `schema.sql` or add `createDatabaseIfNotExist=true` to the JDBC URL |
| Blank chart / no data | Add at least one expense first |
| Port 8080 already in use | Change `server.port` in `application.properties` and update `API_BASE` in `app.js` |

---

## Entity: Expense

| Field       | Type    | Constraint       |
|-------------|---------|------------------|
| id          | INT     | PK, AUTO_INCREMENT |
| amount      | DOUBLE  | NOT NULL, > 0    |
| category    | VARCHAR(100) | NOT NULL    |
| description | VARCHAR(255) | Optional    |
| date        | DATE    | NOT NULL         |
