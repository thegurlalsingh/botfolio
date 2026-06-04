import { IsArray, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsString() @IsOptional() name? : string;
    @IsString() @IsOptional() phone? : string;
    @IsString() @IsOptional() location? : string;
    @IsString() @IsOptional() designation? : string;
    @IsArray() @IsOptional() skills? : [];
    @IsArray() @IsOptional() experienceTimeline? : any[];
    @IsArray() @IsOptional() educationTimeLine? : any[];

}