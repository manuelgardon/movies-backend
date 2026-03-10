import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { User } from '../movies/entities/user.entity';
import { AuthService } from './auth.service';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('creates a user and returns data without password', async () => {
      const dto = { email: 'test@test.com', password: 'password123' };
      userRepo.findOne.mockResolvedValue(null);
      const savedUser: User = {
        id: 'uuid-1',
        email: dto.email,
        password: 'hashed',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      userRepo.create.mockReturnValue(savedUser);
      userRepo.save.mockResolvedValue(savedUser);

      const result = await service.register(dto);

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(dto.email);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('hashes the password before saving', async () => {
      const dto = { email: 'test@test.com', password: 'plainpassword' };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((data) => data as User);
      userRepo.save.mockImplementation(async (user) => ({
        ...user,
        id: 'uuid-1',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await service.register(dto);

      const createCall = userRepo.create.mock.calls[0][0] as Partial<User>;
      expect(createCall.password).not.toBe(dto.password);
      const isHashed = await bcrypt.compare(dto.password, createCall.password!);
      expect(isHashed).toBe(true);
    });

    it('throws ConflictException when email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'existing' } as User);

      await expect(
        service.register({ email: 'taken@test.com', password: 'pass1234' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns access_token for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10);
      userRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'user@test.com',
        password: hashedPassword,
        role: Role.USER,
      } as User);
      jwtService.sign.mockReturnValue('jwt.token.here');

      const result = await service.login({
        email: 'user@test.com',
        password: 'correctpass',
      });

      expect(result).toEqual({ access_token: 'jwt.token.here' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-1',
        email: 'user@test.com',
        role: Role.USER,
      });
    });

    it('throws UnauthorizedException when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nouser@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10);
      userRepo.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'user@test.com',
        password: hashedPassword,
        role: Role.USER,
      } as User);

      await expect(
        service.login({ email: 'user@test.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
