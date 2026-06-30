import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USERS_REPOSITORY_TOKEN } from './ports/users.repository';
import type { IUsersRepository } from './ports/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { IUser } from './interfaces/user.interface';
import { tryCatch } from 'src/common/utils/try-catch';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<UserResponseDto>> {
    const [result, error] = await tryCatch(
      this.usersRepository.findAll(pagination),
    );

    if (error || !result) {
      this.logger.error(`findAll - ${error?.message}`);
      throw error;
    }

    return new PaginationResponseDto(
      result.items.map((user) => new UserResponseDto(user)),
      result.total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(id: string): Promise<UserResponseDto> {
    const [user, error] = await tryCatch(this.usersRepository.findById(id));

    if (error) {
      this.logger.error(`findById - ${error.message}`);
      throw error;
    }

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return new UserResponseDto(user);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const [user, error] = await tryCatch(
      this.usersRepository.findByEmail(email),
    );

    if (error) {
      this.logger.error(`findByEmail - ${error.message}`);
      throw error;
    }

    return user;
  }

  async create(data: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [user, error] = await tryCatch(
      this.usersRepository.create({
        ...data,
        password: passwordHash,
      }),
    );

    if (error || !user) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }

    return new UserResponseDto(user);
  }

  async update(
    id: string,
    data: UpdateUserDto,
    currentUserId: string,
    isAdmin: boolean,
  ): Promise<UserResponseDto> {
    if (!isAdmin && id !== currentUserId) {
      throw new NotFoundException('User not found');
    }

    await this.findById(id);

    if (!isAdmin && data.role) {
      delete data.role;
    }

    let updateData = { ...data };

    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      updateData = { ...updateData, password: passwordHash };
    }

    const [updatedUser, error] = await tryCatch(
      this.usersRepository.update(id, updateData),
    );

    if (error || !updatedUser) {
      this.logger.error(`update - ${error?.message}`);
      throw error;
    }

    return new UserResponseDto(updatedUser);
  }

  async adminUpdate(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    await this.findById(id);

    let updateData = { ...data };

    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      updateData = { ...updateData, password: passwordHash };
    }

    const [updatedUser, error] = await tryCatch(
      this.usersRepository.update(id, updateData),
    );

    if (error || !updatedUser) {
      this.logger.error(`adminUpdate - ${error?.message}`);
      throw error;
    }

    return new UserResponseDto(updatedUser);
  }

  async getById(id: string): Promise<IUser> {
    const [user, error] = await tryCatch(this.usersRepository.findById(id));

    if (error) {
      this.logger.error(`getById - ${error.message}`);
      throw error;
    }

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: string): Promise<UserResponseDto> {
    await this.findById(id);

    const [removedUser, error] = await tryCatch(
      this.usersRepository.remove(id),
    );

    if (error || !removedUser) {
      this.logger.error(`remove - ${error?.message}`);
      throw error;
    }

    return new UserResponseDto(removedUser);
  }
}
