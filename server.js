require('dotenv').config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require('multer');
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const cron = require('node-cron');
const PDFDocument = require('pdfkit');
const fs = require('fs');
    

app.use(cors());
app.use(express.json());
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads'); // The folder where the images will be saved; adjust if needed
    },
    filename: function (req, file, callback) {
        // Create a unique filename for the image
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});


const upload = multer({ storage: storage }).single('image');  

// //Create a MySQL database connection
// const db = mysql.createConnection({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "safex"
// });

// Create a MySQL database connection
const db = mysql.createConnection({
    host: "node236.r-usdatacenter.register.lk",
    user: "machmavc_root",
    password: "Safex@2024",
    database: "machmavc_SafeX"
});

// Progression calculation
function calculateProgress(startDate, estimatedDurationDays) {
    const start = new Date(startDate); // Start date convert to a Date object
    const now = new Date(); // Get the current date and time
    const duration = estimatedDurationDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    const elapsed = now - start; // Calculate the elapsed time in milliseconds
    let progress = Math.min((elapsed / duration) * 100, 100); // Calculate the progress as a percentage
    return progress.toFixed(2); // Formats the number to 2 decimal places
  }     

// LogIn
app.post('/login', (req, res) => {
    const { Username, Password } = req.body;
    const sql = "SELECT * FROM Login WHERE Username = ?";
    db.query(sql, [Username], (err, data) => {
        if (err) return res.status(500).json("Error"); // Handle database error
        // Check if user with given username exists
        if (data.length > 0) {
            // Compare password with hashed password from database
            bcrypt.compare(Password, data[0].Password, (err, isMatch) => {
                if (err) return res.status(500).json("Error"); // Handle bcrypt error
                // If passwords match, generate and return a JWT token
                if (isMatch) {
                    jwt.sign({
                        username: data[0].Username, // Include username in token payload
                        companyID: data[0].Company_ID, // Include company ID in token payload
                        role: data[0].Access_Level // Include access level in token payload
                    }, 'secretkey', { expiresIn: '2h' }, (err, token) => {
                        if (err) return res.status(500).json("Error signing token"); // Handle JWT signing error
                        // Return the token and user role in the response
                        res.json({ token, role: data[0].Access_Level });
                    });
                } else {
                    // Return error message if passwords don't match
                    res.status(401).json("Incorrect username or password");
                }
            });
        } else {
            // Return error message if user with given username doesn't exist
            res.status(404).json("User not found");
        }
    });
});

// Change password with JWT
app.post('/changePassword', verifyToken, (req, res) => {
    const { oldPassword, newPassword } = req.body;
    // Check if both old and new passwords are provided
    if (!oldPassword || !newPassword) {
        return res.status(400).send("Old and new passwords are required.");
    }

    // Verify the JWT token
    jwt.verify(req.token, 'secretkey', (err, decoded) => {
        if (err) {
            return res.status(401).send("Invalid token.");
        }
        // Extract the username from the decoded token
        const username = decoded.username;

        // SQL query to check if the user exists
        const checkUserSql = "SELECT * FROM Login WHERE Username = ?";
        db.query(checkUserSql, [username], (err, result) => {
            if (err) {
                return res.status(500).send("Error checking user.");
            }
            // Check if user exists
            if (result.length > 0) {
                // Compare the old password with the hashed password in the database
                bcrypt.compare(oldPassword, result[0].Password, (err, isMatch) => {
                    if (err) {
                        return res.status(500).send("Error checking password.");
                    }
                    if (isMatch) {
                        // If old password matches, hash the new password and update the database
                        const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

                        // SQL query to update the user's password
                        const updatePasswordSql = "UPDATE Login SET Password = ? WHERE Username = ?";
                        db.query(updatePasswordSql, [hashedNewPassword, username], (updateErr) => {
                            if (updateErr) {
                                return res.status(500).send("Error updating password.");
                            }
                            res.send("Password successfully updated.");
                        });
                    } else {
                        res.status(401).send("Incorrect old password.");
                    }
                });
            } else {
                res.status(404).send("User not found.");
            }
        });
    });
});


// Setup the nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'sudeepaweerasena@gmail.com',
        pass: 'swhr znkc lvzl jmce' 
    }
});

// Route to report an issue via email
app.post('/reportIssue', (req, res) => {
    const { name, email, issue } = req.body;

    // Define the email options
    const mailOptions = {
        from: 'sudeepaweerasena@gmail.com',
        to: 'sudeepaweerasena@gmail.com',
        subject: 'New Issue Reported',
        text: `Name: ${name}\nEmail: ${email}\nIssue: ${issue}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return res.status(500).send("Error sending email.");
        }
        res.send("Issue reported successfully and email sent.");
    });
});

//Massage
app.post('/sendMessage', (req, res) => {
    const { to, from, message } = req.body; // Assuming the names 'to', 'from', 'message' are used in the front-end form

    // Define the email options
    const mailOptions = {
        from: 'sudeepaweerasena@gmail.com', 
        to: to, // The recipient's email address, dynamically set based on form input
        subject: 'New Message',
        text: `From: ${from}\nMessage: ${message}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
            return res.status(500).send("Error sending email.");
        }
        console.log('Email sent:', info.response);
        res.send("Message sent successfully.");
    });
});

// Leave
app.post('/submitLeave', verifyToken, (req, res) => { // Leave request submission endpoint        
    const { Employee_ID, Start_Date, End_Date, Reason } = req.body; // Extract leave request details from request body

    // SQL query to insert the leave request into the database
    const insertLeaveSql = `
        INSERT INTO \`Leave\` (Employee_ID, Start_Date, End_Date, Reason) 
        VALUES (?, ?, ?, ?)
    `;

    // Insert the leave request into the database
    db.query(insertLeaveSql, [Employee_ID, Start_Date, End_Date, Reason], (err, result) => {
        if (err) {
            console.error('Error submitting leave:', err);
            return res.status(500).send("Error submitting leave request.");
        }

        // Fetch the employee's email and name
        const fetchEmployeeEmailSql = "SELECT Email, Employee_Name FROM Employee WHERE Employee_ID = ?";
        db.query(fetchEmployeeEmailSql, [Employee_ID], (fetchErr, fetchResults) => {
            if (fetchErr) {
                console.error('Error fetching employee email:', fetchErr);
                return res.status(500).send("Error fetching employee email.");
            }

            // Check if employee email is found
            if (fetchResults.length > 0) {
                const employeeEmail = fetchResults[0].Email;
                const employeeName = fetchResults[0].Employee_Name;
                const loggedInUserEmail = req.user.username; // Get the logged-in user's email from JWT token

                // Send Email
                const mailOptions = {
                    from: 'sudeepaweerasena@gmail.com', 
                    to: loggedInUserEmail,
                    cc: employeeEmail,
                    subject: 'Leave Request Submitted',
                    text: `Leave Request Details:\n\nEmployee Name: ${employeeName}\nEmployee ID: ${Employee_ID}\nStart Date: ${Start_Date}\nEnd Date: ${End_Date}\nReason: ${Reason}`
                };

                transporter.sendMail(mailOptions, (mailErr, info) => {
                    if (mailErr) {
                        console.error('Error sending email:', mailErr);
                        return res.status(500).send("Error sending email.");
                    }
                    res.send("Leave request submitted successfully and email sent.");
                });
            } else {
                res.status(404).send("Employee email not found.");
            }
        });
    });
});

//Material
app.post('/material_req', verifyToken, (req, res) => {
    const { Quantity_Requested, Receiving_Date, Supervisor_Name, Material_ID } = req.body;
    const Company_ID = req.user.companyID;

    // Insert the material request into the database
    const insertRequestSql = `
        INSERT INTO Material_Request (Quantity_Requested, Receiving_Date, Supervisor_Name, Material_ID, Company_ID) 
        VALUES (?, ?, ?, ?, ?)
    `;

    // Insert the material request into the database
    db.query(insertRequestSql, [Quantity_Requested, Receiving_Date, Supervisor_Name, Material_ID, Company_ID], (err, result) => {
        if (err) {
            console.error('Error submitting item request:', err);
            return res.status(500).send("Error submitting item request.");
        }
        res.send("Item request submitted successfully.");
    });
});

//Get all emplayee details 
app.post('/employees', verifyToken, (req, res) => { // Get all employee details endpoint
    jwt.verify(req.token, 'secretkey', (err, decoded) => {
        if (err) return res.status(401).send("Invalid token.");
        const companyID = decoded.companyID; // Extract the company ID from the decoded token
        const sql = "SELECT * FROM Employee WHERE Company_ID = ?";
        // Query the database for employees
        db.query(sql, [companyID], (err, employees) => {
            if (err) {
                console.error("SQL Error:", err);
                return res.status(500).send("Error fetching employees.");
            }
            res.json(employees); // Return the list of employees as JSON
        });
    });
});


// Get a specific employee's details
app.post('/Employee', verifyToken, (req, res) => {
    const employeeId = req.body.Employee_ID; // Get the Employee_ID from the request body
    const sql = "SELECT Employee_ID, Employee_Name, Position, Join_Date, Telephone_No, Email, Helmet_ID, Photo FROM Employee WHERE Employee_ID = ?";
    db.query(sql, [employeeId], (err, result) => { // Query the database for the employee with the specified Employee_ID
        if(err) {
            return res.status(500).send({ error: "Error fetching employee details", details: err });
        }
        if(result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).send({ message: "Employee not found" });
        }
    });
});

//Display materials
app.post('/materials', (req, res) => { // Endpoint to display materials
    const sql = "SELECT Material_ID, Type, Quantity FROM Materials";
    db.query(sql, (err, materials) => { // Query the database for materials
        if (err) {
            return res.status(500).send("Error fetching materials.");
        }
        res.json(materials); // Return the list of materials as JSON
    });
});

//Display alerts
app.post('/alert-history', verifyToken, (req, res) => { // Endpoint to display alert history
    jwt.verify(req.token, 'secretkey', (err, decoded) => { // Verify the JWT token
        if (err) return res.status(401).send("Invalid token.");
        const companyID = decoded.companyID; // Extract the company ID from the decoded token

        const sql = `
            SELECT ah.Alert_ID, ah.Alert_Type, ah.Date, ah.Time, ah.Employee_Name
            FROM Alert_History ah
            JOIN Employee e ON ah.Employee_ID = e.Employee_ID
            WHERE e.Company_ID = ?
            ORDER BY ah.Date DESC, ah.Time DESC`;
        db.query(sql, [companyID], (err, alerts) => { // Query the database for alert history
            if (err) return res.status(500).send("Error fetching alert history.");
            res.json(alerts); // Return the list of alerts as JSON
        });
    });
});
//Display workers on leave
app.post('/workers-on-leave', verifyToken, (req, res) => { // Endpoint to display workers on leave
    jwt.verify(req.token, 'secretkey', (err, decoded) => { // Verify the JWT token
        if (err) return res.status(401).send("Invalid token.");
        const companyID = decoded.companyID; // Extract the company ID from the decoded token
        const today = new Date().toISOString().slice(0, 10); // Get the current date

        const sql = `
        SELECT l.Leaving_ID, l.Reason, l.Start_Date, l.End_Date, e.Employee_Name, e.Photo
        FROM \`Leave\` l
        JOIN Employee e ON l.Employee_ID = e.Employee_ID
        JOIN Employee emp ON l.Employee_ID = emp.Employee_ID
        WHERE e.Company_ID = ? AND l.Start_Date <= ? AND l.End_Date >= ?`;
        db.query(sql, [companyID, today, today], (err, leaveRecords) => { // Query the database for leave records
            if (err) return res.status(500).send("Error fetching leave records."); // Return the list of leave records as JSON
            res.json(leaveRecords);
        });
    });
});



//Display project progress
app.post('/project-progress', verifyToken, (req, res) => { // Endpoint to display project progress
    jwt.verify(req.token, 'secretkey', (err, decoded) => { // Verify the JWT token
        if (err) {
            return res.status(401).send("Invalid token.");
        }

        const companyID = decoded.companyID;

        // Fetching the latest project for the company
        const sql = `
            SELECT Project_ID, Start_Date, estimatedDurationDays, Project_Name 
            FROM projects 
            WHERE Company_ID = ? 
            ORDER BY Start_Date DESC 
            LIMIT 1`;

        db.query(sql, [companyID], (err, results) => {
            if (err) {
                return res.status(500).send({ error: "Error fetching project progress details", details: err });
            }
            if (results.length > 0) {
                // Calculate the progress of the project
                const { Start_Date, estimatedDurationDays } = results[0];
                const progress = calculateProgress(Start_Date, estimatedDurationDays);
                // Return the project name and progress as JSON
                res.json({ Project_Name: results[0].Project_Name, progress: progress });
            } else {
                // Return a 404 status if no projects are found for the company
                res.status(404).send({ message: "No projects found for this company" });
            }
        });
    });
});


// Middleware to Verify JWT Token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        req.token = bearerToken; 

        // Verify and decode the token
        jwt.verify(bearerToken, 'secretkey', (err, decoded) => {
            if (err) {
                // If token is invalid, send a 401 Unauthorized response
                return res.status(401).send('Invalid token');
            }

            req.user = decoded; // Assign the decoded payload to req.user
            next(); // Continue to the next middleware/route handler
        });
    } else {
        // If no token is found, send a 403 Forbidden response
        res.sendStatus(403);
    }
}



// Protected route using JWT token
app.post('/protected-route', verifyToken, (req, res) => {
    // Verify the JWT token
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            // Error massage for the invalid token
            res.sendStatus(403);
        } else {
            // Token is valid, send a JSON response with a message and the authenticated data
            res.json({ message: 'Access granted', authData });
        }
    });
});

// Add Employee endpoint with image upload
app.post('/addEmployee', verifyToken, verifySuperAdmin, (req, res) => {
    // Use multer to handle file upload
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(500).json({ message: "Multer upload error", error: err.toString() });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(500).json({ message: "Unknown upload error", error: err.toString() });
        }

        // Save everything to the database.
        const { name, email, position, telephoneNumber, hourlyRate, joinDate, helmetID } = req.body;
        let imagePath = req.file ? req.file.path : 'path/to/default/image.png'; // Set a default image path if no file was uploaded

        // Insert into database
        const insertEmployeeSql = `
            INSERT INTO Employee (Employee_Name, Email, Position, Telephone_No, Hourly_Rate, Join_Date, Photo, Helmet_ID, Company_ID) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Get the company ID from the decoded token
        const companyID = req.user.companyID; 

        db.query(insertEmployeeSql, [name, email, position, telephoneNumber, hourlyRate, joinDate, imagePath, helmetID, companyID], (dbErr, dbRes) => {
            if (dbErr) {
                // Handle your database error
                return res.status(500).json({ message: "Database operation failed", error: dbErr.toString() });
            }
            res.status(200).json({ message: "Employee added successfully", data: dbRes });
        });
    });
});


 

// Endpoint to calculate salary and send email with personalized content
app.post('/calculateSalary', verifyToken, verifySuperAdmin, (req, res) => {
    const { employeeID } = req.body;

    // Fetch total hours and hourly rate for the employee
    const fetchEmployeeDataSql = `
        SELECT Helmet.Total_Hours
        FROM Employee
        JOIN Helmet ON Employee.Helmet_ID = Helmet.Helmet_ID
        WHERE Employee.Employee_ID = ?
    `;

    db.query(fetchEmployeeDataSql, [employeeID], (fetchErr, fetchResults) => {
        if (fetchErr) {
            return res.status(500).send("Error fetching employee data.");
        }

        if (fetchResults.length > 0) {
            const { Total_Hours } = fetchResults[0];
            const totalSalary = Total_Hours * 3500; // Assuming hourly rate is 3500

            // SQL query to insert salary calculation into the database
            const insertSalaryCalculationSql = `
                INSERT INTO Salary_Calculation (Total_Salary, Employee_ID, Helmet_ID) 
                VALUES (?, ?, ?)
            `;

            db.query(insertSalaryCalculationSql, [totalSalary, employeeID, fetchResults[0].Helmet_ID], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error with salary calculation.");
                }

                // Fetch the employee's email, name, and company name
                const fetchEmployeeDetailsSql = `
                    SELECT Employee.Employee_Name, Employee.Email, Company.Company_Name
                    FROM Employee
                    JOIN Company ON Employee.Company_ID = Company.Company_ID
                    WHERE Employee.Employee_ID = ?
                `;

                db.query(fetchEmployeeDetailsSql, [employeeID], (detailsErr, detailsResults) => {
                    if (detailsErr) {
                        console.error(detailsErr);
                        return res.status(500).send("Error fetching employee details.");
                    }

                    if (detailsResults.length > 0) {
                        const { Email, Employee_Name, Company_Name } = detailsResults[0];

                        // Define the email options
                        const mailOptions = {
                            from: 'sudeepaweerasena@gmail.com',
                            to: Email,
                            subject: 'Salary Payment Summary',
                            text: `Dear ${Employee_Name},

Date: ${new Date().toLocaleDateString()}
Total Salary: Rs.${totalSalary}

Your salary of Rs.${totalSalary} for this month is ready to collect now. Please collect your salary cheque as soon as possible from the accounts department.

Thank you
Best Regards
${Company_Name}
Accounts Department`
                        };

                        // Send the email
                        transporter.sendMail(mailOptions, (mailErr, info) => {
                            if (mailErr) {
                                console.error(mailErr);
                                return res.status(500).send("Error sending email.");
                            }
                            res.status(200).send("Salary calculated and email sent successfully.");
                        });
                    } else {
                        res.status(404).send("Employee not found.");
                    }
                });
            });
        } else {
            res.status(404).send("Employee not found or helmet data missing.");
        }
    });
});

// Function to handle salary calculation and email for a single employee
function calculateAndSendSalaryForEmployee(employeeID) {
    // Fetch total hours and hourly rate for the employee
    const fetchEmployeeDataSql = `
        SELECT Helmet.Total_Hours, Employee.Email, Employee.Employee_Name, Company.Company_Name
        FROM Employee
        JOIN Helmet ON Employee.Helmet_ID = Helmet.Helmet_ID
        JOIN Company ON Employee.Company_ID = Company.Company_ID
        WHERE Employee.Employee_ID = ?
    `;

    db.query(fetchEmployeeDataSql, [employeeID], (fetchErr, fetchResults) => {
        if (fetchErr) {
            console.error('Error fetching employee data:', fetchErr);
            return;
        }

        if (fetchResults.length > 0) {
            const { Total_Hours, Email, Employee_Name, Company_Name } = fetchResults[0];
            const totalSalary = Total_Hours * 3500; // Assuming hourly rate is 3500

            // Define the email options
            const mailOptions = {
                from: 'sudeepaweerasena@gmail.com',
                to: Email,
                subject: 'Salary Payment Summary',
                text: `Dear ${Employee_Name},

Date: ${new Date().toLocaleDateString()}
Total Salary: Rs.${totalSalary}

Your salary of Rs.${totalSalary} for this month is ready to collect now. Please collect your salary cheque as soon as possible from the accounts department.

Thank you
Best Regards
${Company_Name}
Accounts Department`
            };

            // Send the email
            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error(`Error sending email to ${Email}:`, mailErr);
                } else {
                    console.log(`Salary email sent to ${Email}:`, info.response);

                    // Insert the salary calculation details into the database
                    const insertSql = `
                        INSERT INTO Salary_Calculation (Employee_ID, Total_Salary)
                        VALUES (?, ?)
                    `;
                    db.query(insertSql, [employeeID, totalSalary], (insertErr, insertResults) => {
                        if (insertErr) {
                            console.error('Error inserting salary calculation:', insertErr);
                        } else {
                            console.log('Salary calculation inserted into database:', insertResults);
                        }
                    });
                }
            });
        } else {
            console.error('Employee not found or helmet data missing.');
        }
    });
}


// Function to calculate salary and send emails
function calculateAndSendSalaries() {
    const sql = "SELECT Employee_ID FROM Employee";
    db.query(sql, (err, employees) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return;
        }

        employees.forEach(employee => {
            calculateAndSendSalaryForEmployee(employee.Employee_ID);
        });
    });
}

// Schedule the job for the 28th of every month at 11:40 AM
cron.schedule('50 22 28 * *', calculateAndSendSalaries, {
    scheduled: true,
    timezone: "Asia/Colombo"
});    

function verifyAdmin(req, res, next) {
    jwt.verify(req.token, 'secretkey', (err, decoded) => {
        if (err) return res.status(401).send("Invalid token.");
        if (decoded.role !== 'Admin') return res.status(403).send("You are not authorized for this.");
        next();
    });
}

function verifySuperAdmin(req, res, next) {
    jwt.verify(req.token, 'secretkey', (err, decoded) => {
        if (err) return res.status(401).send("Invalid token.");
        if (decoded.role !== 'Super_Admin') return res.status(403).send("You are not authorized for this.");
        next();
    });
}

// Helper function to format dates in DD/MM/YYYY
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Generate report and send as email
app.post('/generate-report', verifyToken, verifySuperAdmin, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            console.error('JWT Verification Error:', err);
            return res.sendStatus(403);
        }
        const userRole = req.user.role; // Extract user role from JWT payload
        if(userRole !== 'Super_Admin') {
            return res.status(403).send('You are not authorized for this task.');
        }

        const companyID = authData.companyID;
        // Query to fetch company and project details
        const companyQuery = `
        SELECT 
            c.Company_Name, 
            p.Project_Name, 
            p.Start_Date,
            p.estimatedDurationDays
        FROM 
            Company c
        LEFT JOIN 
            Projects p ON c.Company_ID = p.Company_ID
        WHERE 
            c.Company_ID = ?
        GROUP BY 
            c.Company_ID, p.Project_ID`;

        // Query the database to fetch company and project details
        db.query(companyQuery, [companyID], (dbErr, companyResults) => {
            if (dbErr) {
                console.error('Database Error:', dbErr);
                return res.status(500).send('Error fetching data for report: ' + dbErr.message);
            }
            if (companyResults.length === 0) {
                return res.status(404).send('No data found for the provided company ID');
            }

            // Extracting data for the report
            const data = companyResults[0];
            const startDate = new Date(data.Start_Date);
            const endDate = new Date(startDate.getTime() + data.estimatedDurationDays * 24 * 60 * 60 * 1000);
            const progress = calculateProgress(data.Start_Date, data.estimatedDurationDays);

            // Generating PDF Report
            const reportPath = path.join(__dirname, 'reports', `report-${companyID}-${Date.now()}.pdf`);
            const doc = new PDFDocument();
            doc.pipe(fs.createWriteStream(reportPath));

            // Building the PDF content
            doc.image('Safex-logo.png', 50, 20, { width: 100 })
                .fontSize(10)
                .fillColor('black')
                .text('Powered by SafeX', 160, 40, { continued: true })
                .fontSize(12)
                .text('', { align: 'right' })
                .moveDown(1)
                .fontSize(26)
                .fillColor('navy')
                .font('Helvetica-Bold')
                .text('Report Summary', { align: 'center' })
                .moveDown(2)
                .fontSize(12)
                .fillColor('black')
                .font('Helvetica')
                .lineGap(4)
                .text(`Date: ${formatDate(new Date())}`)
                .text(`Company Name: ${data.Company_Name}`)
                .text(`Project Name: ${data.Project_Name || 'N/A'}`)
                .text(`Duration: From ${formatDate(startDate)} To ${formatDate(endDate)}`)
                .text(`Progress: ${progress}%`)
                .moveDown(2)
                .fontSize(14)
                .fillColor('navy')
                .font('Helvetica-Bold')
                .text('Requested Materials List:')
                .font('Helvetica')
                .fontSize(12);

            // Fetching material requests and adding them to the PDF
            const materialRequestQuery = `
            SELECT 
                mr.Quantity_Requested, 
                mr.Receiving_Date, 
                m.Type
            FROM 
                Material_Request mr
            JOIN 
                Materials m ON mr.Material_ID = m.Material_ID
            WHERE 
                mr.Company_ID = ?`;

                // Query the database to fetch material requests
            db.query(materialRequestQuery, [companyID], (materialErr, materialResults) => {
                if (materialErr) {
                    console.error('Error fetching material requests:', materialErr);
                    return res.status(500).send('Error fetching material requests: ' + materialErr.message);
                }

                // Adding material requests to the PDF
                if (materialResults.length > 0) {
                    materialResults.forEach((item, index) => {
                        let materialString = `${index + 1}. Item Name: ${item.Type} – QTY: ${item.Quantity_Requested} – Requested Date: ${formatDate(new Date(item.Receiving_Date))}`;
                        doc.text(materialString);
                    });
                } else {
                    doc.text('No materials requested.');
                }

                // Finalizing the PDF and sending the email
                doc.end();
                sendReportAsEmail(companyID, reportPath, res);
            });
        });
    });
});

// Function to send the generated report as an email
function sendReportAsEmail(companyID, reportPath, res) {
    const emailQuery = 'SELECT Username FROM Login WHERE Company_ID = ?';
    db.query(emailQuery, [companyID], (emailErr, emailResults) => {
        if (emailErr) {
            console.error('Error fetching user email:', emailErr);
            return res.status(500).send('Error fetching user email: ' + emailErr.message);
        }

        if (emailResults.length === 0) {
            return res.status(404).send('Email not found for the provided company ID');
        }

        const userEmail = emailResults[0].Username; // Username is used as the email
        if (!userEmail) {
            return res.status(404).send('No email address found for the given company ID');
        }
        const mailOptions = {
            from: 'sudeepaweerasena@gamil.com',
            to: userEmail,
            subject: 'Your Report',
            text: `Date: ${new Date().toLocaleDateString()}\nYour Report is successfully generated and has been attached to this email.`,
            attachments: [{
                filename: 'report.pdf',
                path: reportPath
            }]
        };

        // Sending the email with the generated report as an attachment
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                res.status(500).send('Error sending email');
            } else {
                console.log('Email sent:', info.response);
                res.send('Report generated and email sent successfully');
            }
        });
    });
}

// Starting the server
app.listen(8081, ()=> {
    console.log(`Backend Server is running on ${process.env.SERVER_URL}`);
});
