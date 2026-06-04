import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async login(loginDto: LoginDto) {
        console.log('1. Login started with:', loginDto.email);
        const {email, password} = loginDto;
        const normalizedEmail = email.toLowerCase().trim();
        
        console.log('2. Querying Database');
        const user = await this.prisma.user.findUnique({
            where: {email: normalizedEmail},
        });

        if(!user){
            throw new UnauthorizedException('User not found. Either enter correct credentials or contact the team');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            throw new UnauthorizedException('Invalid Password. Enter correct credentials');
        }

        console.log('Credentials matched! Moving Ahead')
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            step: user.currentStep
        };

        const accessToken = this.jwtService.sign(payload, {
            expiresIn: '1h',
            secret: process.env.JWT_SECRET,
        });

        const refreshToken = this.jwtService.sign(
            {sub: user.id},
            {expiresIn: '7d', secret: process.env.JWT_SECRET}
        );

        const hashedRefreshToken = await 
        bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                refreshToken: hashedRefreshToken,
                refreshTokenExpires: new Date(Date.now() + 7 * 24 *60 * 60 * 1000),
            }
        })

        return {
            success: true,
            accessToken,
            refreshToken,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                currentStep: user.currentStep
            }
        };
    }

    async saveProfile(userId: string, data: UpdateProfileDto){
        const {experienceTimeline, educationTimeLine, ...rest} = data;

        return this.prisma.$transaction(async (tx) => {
            
                const updatedUser = await tx.user.update({
                    where: {id: userId},
                    data: {
                        ...rest, currentStep: 'mcq'
                    },
                });

                if(experienceTimeline) {
                    await tx.experienceTimeline.deleteMany({where: {userId}});
                    await tx.experienceTimeline.createMany({
                        data: experienceTimeline.map(exp => ({ ...exp, userId})),
                    });
                }

                if(educationTimeLine) {
                    await tx.educationTimeLine.deleteMany({where: {userId}});
                    await tx.educationTimeLine.createMany({
                        data: educationTimeLine.map(edu => ({ ...edu, userId})),
                    });
                }

                return {
                    success: true,
                    message: 'Profile saved successfully!!!',
                    user: updatedUser
                };
            
            });
    }

    async refresh(refreshTokenDto : RefreshTokenDto) {
        const {refreshToken} = refreshTokenDto;

        let payload;
        try{
            payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET
            });
        }
        catch (e) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const user = await this.prisma.user.findUnique({
            where: {id: payload.sub},
        });

        if(!user || !user.refreshToken) {
            throw new UnauthorizedException('Access Token');
        }

        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if(!isMatch){
            throw new UnauthorizedException('Access Token');
        }

        const newAccessToken = this.jwtService.sign(
            {sub: user.id, email: user.email, role: user.role},
            {expiresIn: '1h', secret: process.env.JWT_SECRET}
        );

        const newRefreshToken = this.jwtService.sign(
            {sub: user.id},
            {expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET}
        );

        await this.prisma.user.update({
            where: {id: user.id},
            data: {
                refreshToken: await bcrypt.hash(newRefreshToken, 10)
            }
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }
}
