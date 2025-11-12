import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: number) {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      addedBy: { id: userId },
    });
    const savedCategory = await this.categoryRepository.save(category);

    const data = await this.findOne(savedCategory.id);

    return {
      ...data,
      addedBy: {
        id: data.addedBy.id,
        name: data.addedBy.name,
      },
    };
  }

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      relations: ['addedBy'],
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        addedBy: { id: true, name: true, email: true },
      },
      order: { createdAt: 'DESC' },
    });

    return categories;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['addedBy'],
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        addedBy: { id: true, name: true, email: true },
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    Object.assign(category, dto);

    await this.categoryRepository.save(category);

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}
