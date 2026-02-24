import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Jane Smith' })
  name?: string;

  @ApiProperty({ example: 'securePassword123', minLength: 6 })
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.MEMBER })
  role?: Role;

  @ApiPropertyOptional({ example: 'team-id' })
  teamId?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: false })
  removeTeam?: boolean;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiPropertyOptional()
  teamId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  organizationId?: string;
}
