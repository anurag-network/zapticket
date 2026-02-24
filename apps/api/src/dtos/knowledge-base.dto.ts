import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ example: 'How to reset your password' })
  title: string;

  @ApiProperty({ example: 'how-to-reset-your-password' })
  slug: string;

  @ApiProperty({ example: 'Follow these steps to reset your password...' })
  content: string;

  @ApiPropertyOptional({ example: 'Learn how to reset your password in a few simple steps.' })
  excerpt?: string;

  @ApiPropertyOptional({ example: 'category-id' })
  categoryId: string;

  @ApiPropertyOptional({ example: false, default: false })
  published?: boolean;

  @ApiPropertyOptional({ example: ['password', 'reset', 'account'], type: [String] })
  tags?: string[];
}

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiPropertyOptional({ example: 0 })
  order?: number;

  @ApiPropertyOptional({ example: 100 })
  views?: number;
}

export class ArticleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  excerpt?: string;

  @ApiProperty()
  published: boolean;

  @ApiProperty()
  order: number;

  @ApiProperty()
  views: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  organizationId: string;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Getting Started' })
  name: string;

  @ApiProperty({ example: 'getting-started' })
  slug: string;

  @ApiPropertyOptional({ example: 'Guides for new users' })
  description?: string;

  @ApiPropertyOptional({ example: '📚' })
  icon?: string;

  @ApiPropertyOptional({ example: null })
  parentCategoryId?: string;
}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  organizationId: string;
}
