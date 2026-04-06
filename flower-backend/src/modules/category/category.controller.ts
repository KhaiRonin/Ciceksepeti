import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Roles } from '../../decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryService } from './category.service';
import { Public } from '../../decorators/public.decorator';
import { ensureCategoryUploadsDir } from '../../common/utils/uploads-path.util';
import { normalizeLocale } from '../../common/utils/locale.util';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  list(@Query('locale') locale?: string) {
    return this.categoryService.list(normalizeLocale(locale));
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Roles('admin')
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, ensureCategoryUploadsDir());
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          cb(null, `${unique}${extname(file.originalname || '')}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file?: { filename: string }) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return {
      url: `/uploads/categories/${file.filename}`,
      filename: file.filename,
    };
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
