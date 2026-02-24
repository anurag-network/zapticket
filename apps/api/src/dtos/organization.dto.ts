import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  slug: string;
}

export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateTeamDto {
  @ApiProperty({ example: 'Support Team' })
  name: string;

  @ApiPropertyOptional({ example: 'First line customer support' })
  description?: string;
}

export class TeamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  organizationId: string;
}

export class AddTeamMemberDto {
  @ApiProperty({ example: 'user-id' })
  userId: string;
}

export class RemoveTeamMemberDto {
  @ApiProperty({ example: 'user-id' })
  userId: string;
}
