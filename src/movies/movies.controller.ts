import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MoviesService } from './movies.service';

@ApiTags('movies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post('sync')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Sync movies from Star Wars API (Admin only)' })
  @ApiResponse({ status: 201, description: 'Returns number of synced films' })
  syncMovies() {
    return this.moviesService.syncFromSwapi();
  }

  @Get()
  @ApiOperation({ summary: 'List all movies' })
  @ApiResponse({ status: 200, description: 'Returns array of movies' })
  findAll() {
    return this.moviesService.findAll();
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Get movie details (User and Admin)' })
  @ApiResponse({ status: 200, description: 'Returns a single movie' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new movie (Admin only)' })
  @ApiResponse({ status: 201, description: 'Movie created' })
  create(@Body() dto: CreateMovieDto) {
    return this.moviesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a movie (Admin only)' })
  @ApiResponse({ status: 200, description: 'Movie updated' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  update(@Param('id') id: string, @Body() dto: UpdateMovieDto) {
    return this.moviesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a movie (Admin only)' })
  @ApiResponse({ status: 204, description: 'Movie deleted' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  remove(@Param('id') id: string) {
    return this.moviesService.remove(id);
  }
}
