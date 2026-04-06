import { Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { UserService } from './user.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  me(@CurrentUser('sub') userId: string) {
    return this.userService.getMe(userId);
  }

  @Put('me')
  updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateMeDto) {
    return this.userService.updateMe(userId, dto);
  }
}
