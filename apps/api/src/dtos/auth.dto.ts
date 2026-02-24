import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'password123' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  password: string;

  @ApiProperty({ example: 'acme-corp', required: false })
  organizationSlug?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    organizationId: string | null;
  };
}

export class RefreshTokenDto {
  @ApiProperty()
  refreshToken: string;
}
