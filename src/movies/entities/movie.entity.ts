import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('movies')
export class Movie {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'A New Hope' })
  @Column()
  title: string;

  @ApiProperty({ example: 4, description: 'Star Wars episode number (unique)' })
  @Column({ unique: true })
  episodeId: number;

  @ApiProperty({ example: 'It is a period of civil war...' })
  @Column({ type: 'text' })
  openingCrawl: string;

  @ApiProperty({ example: 'George Lucas' })
  @Column()
  director: string;

  @ApiProperty({ example: 'Gary Kurtz, Rick McCallum' })
  @Column()
  producer: string;

  @ApiProperty({ example: '1977-05-25' })
  @Column()
  releaseDate: string;

  @ApiPropertyOptional({ example: 'https://swapi.dev/api/films/1/' })
  @Column({ unique: true, nullable: true })
  swapiUrl: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
