import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entities/movie.entity';
import { MoviesService } from './movies.service';

const mockMovieRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
  upsert: jest.fn(),
});

const mockMovie: Movie = {
  id: 'uuid-1',
  title: 'A New Hope',
  episodeId: 4,
  openingCrawl: 'It is a period of civil war...',
  director: 'George Lucas',
  producer: 'Gary Kurtz',
  releaseDate: '1977-05-25',
  swapiUrl: 'https://swapi.dev/api/films/1/',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepo: jest.Mocked<Repository<Movie>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useFactory: mockMovieRepository,
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    movieRepo = module.get(getRepositoryToken(Movie));
  });

  describe('findAll', () => {
    it('returns all movies', async () => {
      movieRepo.find.mockResolvedValue([mockMovie]);
      const result = await service.findAll();
      expect(result).toEqual([mockMovie]);
      expect(movieRepo.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns a movie by id', async () => {
      movieRepo.findOne.mockResolvedValue(mockMovie);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockMovie);
    });

    it('throws NotFoundException when movie does not exist', async () => {
      movieRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns a new movie', async () => {
      const dto: CreateMovieDto = {
        title: 'A New Hope',
        episodeId: 4,
        openingCrawl: 'It is a period of civil war...',
        director: 'George Lucas',
        producer: 'Gary Kurtz',
        releaseDate: '1977-05-25',
      };
      movieRepo.create.mockReturnValue(mockMovie);
      movieRepo.save.mockResolvedValue(mockMovie);

      const result = await service.create(dto);

      expect(result).toEqual(mockMovie);
      expect(movieRepo.create).toHaveBeenCalledWith(dto);
      expect(movieRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates and returns the movie', async () => {
      const updated = { ...mockMovie, title: 'Updated Title' };
      movieRepo.findOne.mockResolvedValue(mockMovie);
      movieRepo.merge.mockReturnValue(updated);
      movieRepo.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(movieRepo.merge).toHaveBeenCalledWith(mockMovie, {
        title: 'Updated Title',
      });
    });

    it('throws NotFoundException when updating non-existent movie', async () => {
      movieRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('nonexistent', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes a movie successfully', async () => {
      movieRepo.findOne.mockResolvedValue(mockMovie);
      movieRepo.remove.mockResolvedValue(mockMovie);

      await service.remove('uuid-1');

      expect(movieRepo.remove).toHaveBeenCalledWith(mockMovie);
    });

    it('throws NotFoundException when removing non-existent movie', async () => {
      movieRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('syncFromSwapi', () => {
    it('fetches films from SWAPI and upserts them', async () => {
      const mockFilms = {
        results: [
          {
            title: 'A New Hope',
            episode_id: 4,
            opening_crawl: 'It is a period of civil war...',
            director: 'George Lucas',
            producer: 'Gary Kurtz',
            release_date: '1977-05-25',
            url: 'https://swapi.dev/api/films/1/',
          },
        ],
      };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockFilms),
      } as unknown as Response);
      movieRepo.upsert.mockResolvedValue({
        identifiers: [],
        generatedMaps: [],
        raw: [],
      });

      const result = await service.syncFromSwapi();

      expect(result).toEqual({ synced: 1 });
      expect(movieRepo.upsert).toHaveBeenCalledWith(
        {
          episodeId: 4,
          title: 'A New Hope',
          openingCrawl: 'It is a period of civil war...',
          director: 'George Lucas',
          producer: 'Gary Kurtz',
          releaseDate: '1977-05-25',
          swapiUrl: 'https://swapi.dev/api/films/1/',
        },
        { conflictPaths: ['episodeId'] },
      );
    });

    it('returns synced count equal to number of films', async () => {
      const mockFilms = {
        results: [
          {
            title: 'A New Hope',
            episode_id: 4,
            opening_crawl: '',
            director: '',
            producer: '',
            release_date: '',
            url: '',
          },
          {
            title: 'The Empire Strikes Back',
            episode_id: 5,
            opening_crawl: '',
            director: '',
            producer: '',
            release_date: '',
            url: '',
          },
        ],
      };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockFilms),
      } as unknown as Response);
      movieRepo.upsert.mockResolvedValue({
        identifiers: [],
        generatedMaps: [],
        raw: [],
      });

      const result = await service.syncFromSwapi();

      expect(result.synced).toBe(2);
    });
  });
});
