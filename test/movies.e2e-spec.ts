import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Movies (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;

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

    // Register and login admin
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'e2e_admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e_admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.access_token;

    // Register and login regular user
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'e2e_user@test.com',
      password: 'password123',
    });
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e_user@test.com', password: 'password123' });
    userToken = userLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication guard', () => {
    it('returns 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer()).get('/movies');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /movies (Admin only)', () => {
    const movieDto = {
      title: 'E2E Test Movie',
      episodeId: 99,
      openingCrawl: 'A test crawl...',
      director: 'Test Director',
      producer: 'Test Producer',
      releaseDate: '2025-01-01',
    };

    it('allows admin to create a movie', async () => {
      // Arrange + Act
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(movieDto);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(movieDto.title);
      expect(response.body).toHaveProperty('id');
    });

    it('returns 403 when user tries to create a movie', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send(movieDto);

      expect(response.status).toBe(403);
    });

    it('returns 400 for invalid movie data', async () => {
      const response = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing fields' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /movies', () => {
    it('returns array of movies for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('returns array of movies for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /movies/:id', () => {
    let movieId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Movie For Get Test',
          episodeId: 98,
          openingCrawl: 'Crawl',
          director: 'Director',
          producer: 'Producer',
          releaseDate: '2025-01-01',
        });
      movieId = res.body.id;
    });

    it('returns movie details for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(movieId);
    });

    it('returns 404 for non-existent movie', async () => {
      const response = await request(app.getHttpServer())
        .get('/movies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /movies/:id (Admin only)', () => {
    let movieId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Movie To Update',
          episodeId: 97,
          openingCrawl: 'Crawl',
          director: 'Director',
          producer: 'Producer',
          releaseDate: '2025-01-01',
        });
      movieId = res.body.id;
    });

    it('allows admin to update a movie', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });

    it('returns 403 when user tries to update a movie', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Hacked' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /movies/:id (Admin only)', () => {
    let movieId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Movie To Delete',
          episodeId: 96,
          openingCrawl: 'Crawl',
          director: 'Director',
          producer: 'Producer',
          releaseDate: '2025-01-01',
        });
      movieId = res.body.id;
    });

    it('returns 403 when user tries to delete a movie', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('allows admin to delete a movie', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });
  });
});
