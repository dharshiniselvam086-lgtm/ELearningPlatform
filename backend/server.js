const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "elearning_platform"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
        return;
    }

    console.log("MySQL Connected Successfully!");
});

// Test route
app.get("/", (req, res) => {
    res.send("E-Learning Backend is Running!");
});

// Login API
app.post("/login", (req, res) => {

    const { email, password, role } = req.body;

    const sql = `
        SELECT * FROM users
        WHERE email = ? AND password = ? AND role = ?
    `;

    db.query(sql, [email, password, role], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.json({
                success: false,
                message: "Invalid email, password or role"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            user: results[0]
        });
    });
});// Register API
app.post("/register", (req, res) => {

    const { name, email, password, role } = req.body;

    const sql = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [name, email, password, role], (err, result) => {

        if (err) {

            if (err.code === "ER_DUP_ENTRY") {
                return res.json({
                    success: false,
                    message: "Email already registered"
                });
            }

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        res.json({
            success: true,
            message: "Registration successful!"
        });
    });

});
// Enroll Course API
// Enroll Course
app.post("/enroll", (req, res) => {

    const { student_id, course_id } = req.body;


    // Check whether already enrolled

    const checkSql = `
        SELECT *
        FROM enrollments
        WHERE student_id = ?
        AND course_id = ?
    `;


    db.query(
        checkSql,
        [student_id, course_id],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });

            }


            // Already enrolled

            if (results.length > 0) {

                return res.json({
                    success: false,
                    message: "You are already enrolled in this course."
                });

            }


            // New enrollment

            const insertSql = `
                INSERT INTO enrollments
                (student_id, course_id)
                VALUES (?, ?)
            `;


            db.query(
                insertSql,
                [student_id, course_id],
                (err, result) => {

                    if (err) {

                        console.log(err);

                        return res.status(500).json({
                            success: false,
                            message: "Enrollment failed"
                        });

                    }


                    res.json({
                        success: true,
                        message: "Successfully enrolled in the course!"
                    });

                }
            );

        }
    );

});
// Get Student Courses API
app.get("/my-courses/:student_id", (req, res) => {

    const studentId = req.params.student_id;

    const sql = `
        SELECT
            courses.course_id,
            courses.course_name,
            courses.description,
            users.name AS instructor_name
        FROM enrollments
        JOIN courses
            ON enrollments.course_id = courses.course_id
        JOIN users
            ON courses.instructor_id = users.user_id
        WHERE enrollments.student_id = ?
    `;

    db.query(sql, [studentId], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        res.json({
            success: true,
            courses: results
        });

    });

});

// Get Assignments API
app.get("/assignments", (req, res) => {

    const sql = `
        SELECT
            assignments.assignment_id,
            assignments.title,
            assignments.description,
            courses.course_name
        FROM assignments
        JOIN courses
            ON assignments.course_id = courses.course_id
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        res.json({
            success: true,
            assignments: results
        });

    });

});// Submit Assignment API
app.post("/submit-assignment", (req, res) => {

    const { assignment_id, student_id, answer } = req.body;

    const sql = `
        INSERT INTO submissions
        (assignment_id, student_id, answer, marks)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [assignment_id, student_id, answer, 0],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Submission failed"
                });
            }

            res.json({
                success: true,
                message: "Assignment submitted successfully!"
            });

        }
    );

});
// Save Quiz Result API
app.post("/quiz-result", (req, res) => {

    const { quiz_id, student_id, score } = req.body;

    const sql = `
        INSERT INTO quiz_results
        (quiz_id, student_id, score)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [quiz_id, student_id, score],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Quiz result saving failed"
                });
            }

            res.json({
                success: true,
                message: "Quiz result saved successfully!"
            });

        }
    );

});
// Get Student Quiz Result API
app.get("/quiz-result/:student_id", (req, res) => {

    const studentId = req.params.student_id;

    const sql = `
        SELECT
            quiz_results.result_id,
            quiz_results.quiz_id,
            quiz_results.student_id,
            quiz_results.score,
            quiz_results.attempted_at
        FROM quiz_results
        WHERE quiz_results.student_id = ?
        ORDER BY quiz_results.result_id DESC
        LIMIT 1
    `;

    db.query(sql, [studentId], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length === 0) {

            return res.json({
                success: false,
                message: "No quiz result found"
            });
        }

        res.json({
            success: true,
            result: results[0]
        });

    });

});
// Create Course API
app.post("/create-course", (req, res) => {

    const { course_name, description, instructor_id } = req.body;

    const sql = `
        INSERT INTO courses
        (course_name, description, instructor_id)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [course_name, description, instructor_id],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Course creation failed"
                });
            }

            res.json({
                success: true,
                message: "Course created successfully!"
            });

        }
    );

});
// Add Course Material API
app.post("/add-material", (req, res) => {

    const { course_id, title, content } = req.body;

    const sql = `
        INSERT INTO materials
        (course_id, title, content)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [course_id, title, content],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Material adding failed"
                });
            }

            res.json({
                success: true,
                message: "Course material added successfully!"
            });

        }
    );

});
// Create Assignment API
app.post("/create-assignment", (req, res) => {

    const { course_id, title, description } = req.body;

    const sql = `
        INSERT INTO assignments
        (course_id, title, description)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [course_id, title, description],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Assignment creation failed"
                });
            }

            res.json({
                success: true,
                message: "Assignment created successfully!"
            });

        }
    );

});
// Add Quiz Question API
app.post("/add-quiz", (req, res) => {

    const {
        course_id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer
    } = req.body;

    const sql = `
        INSERT INTO quizzes
        (course_id, question, option_a, option_b, option_c, option_d, correct_answer)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            course_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer
        ],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Quiz question adding failed"
                });
            }

            res.json({
                success: true,
                message: "Quiz question added successfully!"
            });

        }
    );

});
// Get Quiz Questions API
app.get("/quizzes/:course_id", (req, res) => {

    const courseId = req.params.course_id;

    const sql = `
        SELECT
            quiz_id,
            question,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer
        FROM quizzes
        WHERE course_id = ?
    `;

    db.query(sql, [courseId], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Unable to load quiz questions"
            });
        }

        res.json({
            success: true,
            quizzes: results
        });

    });

});
// Get Students API
app.get("/students", (req, res) => {

    const sql = `
        SELECT
            user_id,
            name,
            email,
            role
        FROM users
        WHERE role = 'STUDENT'
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Unable to load students"
            });
        }

        res.json({
            success: true,
            students: results
        });

    });

});
// Student Dashboard
app.get("/student-dashboard/:student_id", (req, res) => {

    const studentId = req.params.student_id;

    const sql = `
        SELECT
            (SELECT COUNT(*)
             FROM enrollments
             WHERE student_id = ?) AS enrolled_courses,

            (SELECT COUNT(*)
             FROM assignments) AS assignments,

            (SELECT COUNT(*)
             FROM quiz_results
             WHERE student_id = ?) AS quiz_attempts
    `;

    db.query(
        sql,
        [studentId, studentId],
        (err, results) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to load dashboard"
                });
            }

            res.json({
                success: true,
                dashboard: results[0]
            });

        }
    );

});
// Get All Courses
app.get("/courses", (req, res) => {

    const sql = `
        SELECT
            courses.course_id,
            courses.course_name,
            courses.description,
            users.name AS instructor_name
        FROM courses
        JOIN users
            ON courses.instructor_id = users.user_id
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Unable to load courses"
            });
        }

        res.json({
            success: true,
            courses: results
        });

    });

});
// Get Course Details
app.get("/course/:course_id", (req, res) => {

    const courseId = req.params.course_id;

    const sql = `
        SELECT
            courses.course_id,
            courses.course_name,
            courses.description,
            users.name AS instructor_name
        FROM courses
        JOIN users
            ON courses.instructor_id = users.user_id
        WHERE courses.course_id = ?
    `;

    db.query(sql, [courseId], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Unable to load course details"
            });
        }

        if (results.length === 0) {

            return res.json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            course: results[0]
        });

    });

});
// Get Course Materials
app.get("/materials/:course_id", (req, res) => {

    const courseId = req.params.course_id;

    const sql = `
        SELECT
            material_id,
            course_id,
            title,
            content
        FROM materials
        WHERE course_id = ?
    `;

    db.query(sql, [courseId], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Unable to load course materials"
            });
        }

        res.json({
            success: true,
            materials: results
        });

    });

});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});