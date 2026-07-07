const request = require('supertest');
const app = require('../server');

describe('Health Check API', () => {
  let server;

  beforeAll(() => {
    // Start the server for testing
    server = app.listen(0); // Use random available port
  });

  afterAll((done) => {
    // Close the server after tests
    server.close(done);
  });

  test('GET /health should return 200 and health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'OK');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toBe('connected');
  });

  test('GET /health should include environment info', async () => {
    const response = await request(app).get('/health');
    
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
  });
});
