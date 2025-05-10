import {
  Controller,
  Body,
  Patch,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      req.user.userId,
      updateProfileDto,
    );
    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }
}
