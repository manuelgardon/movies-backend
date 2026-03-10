import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateMovieDto {
  @ApiProperty({ example: 'A New Hope' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @IsPositive()
  episodeId: number;

  @ApiProperty({ example: 'It is a period of civil war...' })
  @IsString()
  @IsNotEmpty()
  openingCrawl: string;

  @ApiProperty({ example: 'George Lucas' })
  @IsString()
  @IsNotEmpty()
  director: string;

  @ApiProperty({ example: 'Gary Kurtz, Rick McCallum' })
  @IsString()
  @IsNotEmpty()
  producer: string;

  @ApiProperty({ example: '1977-05-25' })
  @IsString()
  @IsNotEmpty()
  releaseDate: string;

  @ApiPropertyOptional({ example: 'https://swapi.dev/api/films/1/' })
  @IsUrl()
  @IsOptional()
  swapiUrl?: string;
}
