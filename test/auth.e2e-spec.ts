import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('registers a new user and returns id, email, role', async () => {
      // Arrange
      const dto = { email: 'e2e_register@test.com', password: 'password123' };

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(dto.email);
      expect(response.body.role).toBe('user');
      expect(response.body).not.toHaveProperty('password');
    });

    it('returns 409 when email is already registered', async () => {
      const dto = { email: 'e2e_duplicate@test.com', password: 'password123' };
      await request(app.getHttpServer()).post('/auth/register').send(dto);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto);

      expect(response.status).toBe(409);
    });

    it('returns 400 when password is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'short@test.com', password: '123' });

      expect(response.status).toBe(400);
    });

    it('returns 400 when email is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const credentials = {
      email: 'e2e_login@test.com',
      password: 'password123',
    };

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(credentials);
    });

    it('returns access_token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('returns 401 for wrong password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...credentials, password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });

    it('returns 401 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'noone@test.com', password: 'password123' });

      expect(response.status).toBe(401);
    });
  });
});
