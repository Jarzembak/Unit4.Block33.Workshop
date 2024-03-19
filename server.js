const pg = require("pg");
const express = require("express");
const client = new pg.Client(
    process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);
const app = express();

const init = async () => {
    app.use(express.json());
    app.use(require("morgan")("dev"));


    await client.connect();
    console.log("connected to database");

    let SQL = /*SQL*/ `

        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS department;
        CREATE TABLE department (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL
            );
        CREATE TABLE employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES department(id) NOT NULL
            );`


    await client.query(SQL);
    console.log("tables created");

    SQL = /*SQL*/ `
        INSERT INTO department(name) VALUES('Accounting');
        INSERT INTO department(name) VALUES('IT');
        INSERT INTO department(name) VALUES('Sales');
        INSERT INTO department(name) VALUES('Management');
        INSERT INTO department(name) VALUES('HR');
        INSERT INTO employees(name, department_id) VALUES('Lee Jarzembak', (SELECT id FROM department WHERE name='Accounting'));
        INSERT INTO employees(name, department_id) VALUES('Brett Poindexter', (SELECT id FROM department WHERE name='IT'));
        INSERT INTO employees(name, department_id) VALUES('Matthew Bixby', (SELECT id FROM department WHERE name='Sales'));
        INSERT INTO employees(name, department_id) VALUES('Laura Kuzara', (SELECT id FROM department WHERE name='Management'));
        INSERT INTO employees(name, department_id) VALUES('David Calle', (SELECT id FROM department WHERE name='HR'));
    `;
    await client.query(SQL);
    console.log("data seeded");

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));

    app.get("/api/employees", async (req, res, next) => {
        try {
            const SQL = /*SQL*/ `
                SELECT * from employees
                `;
            const response = await client.query(SQL);
            res.send(response.rows);
        } catch (error) {
            next(error);
        }
    });

    app.get("/api/employees/:id", async (req, res, next) => {
        try {
            const SQL = /*SQL*/ `
                SELECT * from employees
                WHERE id=$1
                `;
            const response = await client.query(SQL, [req.params.id]);
            res.send(response.rows);
        } catch (error) {
            next(error);
        }
    });

    app.get("/api/department", async (req, res, next) => {
        try {
            const SQL = /*SQL*/ `
                SELECT * from department
                `;
            const response = await client.query(SQL);
            res.send(response.rows);
        } catch (error) {
            next(error);
        }
    });

    app.post("/api/employees", async (req, res, next) => {
        try {
            const SQL = /*SQL*/ `
                INSERT INTO employees(name, department_id)
                VALUES ($1, $2)
                RETURNING *
            `;
            const response = await client.query(SQL, [
                req.body.name,
                req.body.department_id,
            ]);
            res.send(response.rows[0]);
        } catch (error) {
            next(error);
        }
    });

    app.put("/api/employees/:id", async(req, res, next) => {
        try {
            const SQL = /*SQL*/ `
            UPDATE employees
            SET name=$1, updated_at=now()
            Where id=$2 RETURNING *
            `;
            const response = await client.query(SQL, [req.body.name, req.params.id]);
            res.send(response.rows[0]);
        } catch (error) {
            next(error);
        }
    })

    app.delete("/api/employees/:id", async(req, res, next) => {
        try {
            const SQL = /*SQL*/ `
            DELETE FROM employees
            WHERE id=$1
            `;
            await client.query(SQL, [req.params.id]);
            res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    })
}

init();