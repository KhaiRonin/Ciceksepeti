import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Roles } from '../../decorators/roles.decorator';
import { Public } from '../../decorators/public.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { ensureProductUploadsDir } from '../../common/utils/uploads-path.util';
import { normalizeLocale } from '../../common/utils/locale.util';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('discounted') discounted?: string,
    @Query('occasion') occasion?: string,
    @Query('locale') locale?: string,
  ) {
    const normalizedLocale = normalizeLocale(locale);

    const parsedPage = Number.parseInt(page ?? '', 10);
    const parsedLimit = Number.parseInt(limit ?? '', 10);

    return this.productService.list({
      page: Number.isFinite(parsedPage) ? parsedPage : 1,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 24,
      categoryId,
      search,
      sort,
      discounted: discounted === 'true',
      occasion,
      locale: normalizedLocale,
    });
  }

  @Public()
  @Get('note-templates')
  listGiftNoteTemplates(@Query('recipientType') recipientType?: string) {
    return this.productService.listActiveGiftNoteTemplates(recipientType);
  }

  @Public()
  @Get(':id')
  getById(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.productService.getById(id, normalizeLocale(locale));
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Roles('admin')
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, ensureProductUploadsDir());
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
      url: `/uploads/products/${file.filename}`,
      filename: file.filename,
    };
  }

  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
