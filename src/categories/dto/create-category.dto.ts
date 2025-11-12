import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Title should be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title: string;

  @IsString({ message: 'Description should be a string' })
  @IsNotEmpty({ message: 'Description cannot be empty' })
  description: string;
}
