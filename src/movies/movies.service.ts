import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';

interface SwapiFilm {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  url: string;
}

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  findAll(): Promise<Movie[]> {
    return this.movieRepository.find();
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.movieRepository.findOne({ where: { id } });
    if (!movie) throw new NotFoundException(`Movie with id ${id} not found`);
    return movie;
  }

  async create(dto: CreateMovieDto): Promise<Movie> {
    const movie = this.movieRepository.create(dto);
    return this.movieRepository.save(movie);
  }

  async update(id: string, dto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.findOne(id);
    const updated = this.movieRepository.merge(movie, dto);
    return this.movieRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findOne(id);
    await this.movieRepository.remove(movie);
  }

  async syncFromSwapi(): Promise<{ synced: number }> {
    const response = await fetch('https://swapi.dev/api/films/');
    const data = (await response.json()) as { results: SwapiFilm[] };

    let synced = 0;
    for (const film of data.results) {
      await this.movieRepository.upsert(
        {
          episodeId: film.episode_id,
          title: film.title,
          openingCrawl: film.opening_crawl,
          director: film.director,
          producer: film.producer,
          releaseDate: film.release_date,
          swapiUrl: film.url,
        },
        { conflictPaths: ['episodeId'] },
      );
      synced++;
    }
    return { synced };
  }
}
