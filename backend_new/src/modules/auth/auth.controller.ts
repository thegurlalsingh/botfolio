import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('api/user')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // Public Route
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto){
        return this.authService.login(loginDto);
    }

    // Protected Route
    @UseGuards(JwtAuthGuard)
    @Put('profile')
    async saveProfile(@Request() req, @Body() updateDto: UpdateProfileDto){
        return this.authService.saveProfile(req.user.id, updateDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() refreshTokenDto: RefreshTokenDto){
        return this.authService.refresh(refreshTokenDto);
    }
}


