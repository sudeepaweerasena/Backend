// Import the necessary modules
const request = require('supertest');

// Specify the URL of your deployed backend on Render
const backendURL = 'http://localhost:8081'; // Replace this with your actual Render backend URL

// Login test
describe('POST /login', () => {
  it('should login a user with correct credentials', async () => {
    const res = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token'); // Assuming the response contains a token
  }, 70000); // Set timeout to 30 seconds (30000 milliseconds)

  it('should reject a login with incorrect credentials', async () => {
    const res = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando2005' });

    expect(res.statusCode).toEqual(401); // or the appropriate status code for failed login
  }, 70000); // Set timeout to 30 seconds (30000 milliseconds)
});

// Report Issue test
describe('POST /reportIssue', () => {
  it('should successfully report an issue', async () => {
    const res = await request(backendURL)
      .post('/reportIssue')
      .send({ name: 'Dinal Fernando', email: 'dinalfernando43@gmail.com', issue: 'Test Issue' });

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
  }, 70000);
});

// Send Message test
describe('POST /sendMessage', () => {
  it('should successfully send a message', async () => {
    const res = await request(backendURL)
      .post('/sendMessage')
      .send({ to: 'dinalfernando43@gmail.com', from: 'dinalfernando43@gmail.com', message: 'Test message' });

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
  }, 70000);
});

// Submit Leave Test
describe('POST /submitLeave', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);

  it('should submit a leave request for authenticated user', async () => {
    const res = await request(backendURL)
      .post('/submitLeave')
      .set('Authorization', `Bearer ${token}`)
      .send({ Employee_ID: '1', Start_Date: '2024-03-25', End_Date: '2024-03-27', Reason: 'Personal' });

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    // Further assertions based on your API response
  }, 70000);
});

// Employee test
describe('POST /employees', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);

  it('should get all employee details for authenticated user', async () => {
    const res = await request(backendURL)
      .post('/employees')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    expect(Array.isArray(res.body)).toBeTruthy(); // Assuming the response is an array of employees
  }, 70000);
});

// Material Request Test
describe('POST /material_req', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);

  it('should submit a material request for authenticated user', async () => {
    const res = await request(backendURL)
      .post('/material_req')
      .set('Authorization', `Bearer ${token}`)
      .send({ Quantity_Requested: 10, Receiving_Date: '2024-03-30', Supervisor_Name: 'Jane Doe', Material_ID: '1' });

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    // Further assertions based on your API response
  }, 70000);
});

// Specific employee test
describe('POST /Employee', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);

  it('should get specific employee details for authenticated user', async () => {
    const res = await request(backendURL)
      .post('/Employee')
      .set('Authorization', `Bearer ${token}`)
      .send({ Employee_ID: '1' });

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    // Further assertions based on your API response
  }, 70000);
});

// materials test
describe('POST /materials', () => {
  it('should fetch materials details', async () => {
    const res = await request(backendURL)
      .post('/materials');

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    expect(Array.isArray(res.body)).toBeTruthy(); // Assuming the response is an array of materials
  }, 70000);
});

// Alert History test
describe('POST /alert-history', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);

  it('should fetch alert history for authenticated user', async () => {
    const res = await request(backendURL)
      .post('/alert-history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    expect(Array.isArray(res.body)).toBeTruthy(); // Assuming the response is an array
  }, 70000);
});

// Worker on leave test
describe('POST /workers-on-leave', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);

  it('should fetch workers on leave for authenticated user', async () => {
    const res = await request(backendURL)
      .post('/workers-on-leave')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    expect(Array.isArray(res.body)).toBeTruthy(); // Assuming the response is an array
  }, 70000);
});

// Add employee test
describe('POST /addEmployee', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);

  it('should add an employee for authenticated and authorized user', async () => {
    const res = await request(backendURL)
      .post('/addEmployee')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'John Doe')
      .field('email', 'johndoe@example.com')
      .field('position', 'Manager')
      .field('telephoneNumber', '1234567890')
      .field('hourlyRate', '1500')
      .field('joinDate', '2024-03-01')
      .field('helmetID', '1')
      // Uncomment and adjust the path to attach a file if necessary. 
      .attach('image', 'Safex-logo.png')
      ;

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    // Further assertions based on your API response
  }, 70000);
});

// generate report testing
describe('POST /generate-report', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);


  it('should generate a report for authenticated and authorized user', async () => {
    const res = await request(backendURL)
      .post('/generate-report')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    // Further assertions based on your API response
  }, 70000);
});

// salary calculate test
describe('POST /calculateSalary', () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(backendURL)
      .post('/login')
      .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando' });
    
    token = loginResponse.body.token; // Store the token for later use
  }, 70000);


  it('should calculate salary for a specific employee', async () => {
    const res = await request(backendURL)
      .post('/calculateSalary')
      .set('Authorization', `Bearer ${token}`)
      .send({ employeeID: '1' }); // Use a valid employee ID

    expect(res.statusCode).toEqual(200); // Assuming 200 is success status
    // Further assertions based on your API response
  }, 70000);
});




// Update Password Test
// describe('POST /changePassword', () => {
//   let token;

//   // Login before running the tests
//   beforeAll(async () => {
//     const loginResponse = await request(backendURL)
//       .post('/login')
//       .send({ Username: 'dinalfernando43@gmail.com', Password: 'Dinalfernando2005' });
    
//     token = loginResponse.body.token; // Store the token for later use
//   }, 70000);

//   // Test for password update
//   it('should update password for authenticated user', async () => {
//     const res = await request(backendURL)
//       .post('/changePassword')
//       .set('Authorization', `Bearer ${token}`) // Set the authorization header with the token
//       .send({ oldPassword: 'Dinalfernando2005', newPassword: 'Dinalfernando' });

//     expect(res.statusCode).toEqual(200); // Assuming 200 is success status
//     // Further assertions based on your API response
//   }, 70000);
// });