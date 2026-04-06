import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Roles } from '../../decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard(@Query('period') period?: string) {
    return this.adminService.getDashboardStats(period);
  }

  @Get('logs')
  logs(@Query('limit') limit?: string) {
    return this.adminService.getLogs(limit);
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }

  @Get('orders')
  orders() {
    return this.adminService.listOrders();
  }

  @Get('orders/:id')
  order(@Param('id') orderId: string) {
    return this.adminService.getOrder(orderId);
  }

  @Get('products')
  products(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('discounted') discounted?: string,
  ) {
    return this.adminService.listProducts({
      page,
      limit,
      search,
      categoryId,
      discounted,
    });
  }

  @Post('catalog/translations/sync')
  syncCatalogTranslations() {
    return this.adminService.syncCatalogTranslations();
  }

  @Post('data_translations/sync')
  syncCatalogTranslationsLegacy() {
    return this.adminService.syncCatalogTranslations();
  }

  @Patch('orders/:id/status')
  updateStatus(@Param('id') orderId: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(orderId, dto.status);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') userId: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(userId, dto.role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  // ─── Kuponlar ────────────────────────────────────────────────────────────
  @Get('coupons')
  listCoupons() {
    return this.adminService.listCoupons();
  }

  @Post('coupons')
  createCoupon(@Body() body: any) {
    return this.adminService.createCoupon(body);
  }

  @Put('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCoupon(id, body);
  }

  @Delete('coupons/:id')
  deleteCoupon(@Param('id') id: string) {
    return this.adminService.deleteCoupon(id);
  }

  // ─── Not Şablonları ───────────────────────────────────────────────────────
  @Get('note-templates')
  listGiftNoteTemplates(
    @Query('recipientType') recipientType?: string,
    @Query('isActive') isActive?: string,
  ) {
    const parsedIsActive =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.adminService.listGiftNoteTemplates({ recipientType, isActive: parsedIsActive });
  }

  @Post('note-templates')
  createGiftNoteTemplate(
    @Body()
    body: { recipientType: string; content: string; sortOrder?: number; isActive?: boolean },
  ) {
    return this.adminService.createGiftNoteTemplate(body);
  }

  @Put('note-templates/:id')
  updateGiftNoteTemplate(
    @Param('id') id: string,
    @Body()
    body: { recipientType?: string; content?: string; sortOrder?: number; isActive?: boolean },
  ) {
    return this.adminService.updateGiftNoteTemplate(id, body);
  }

  @Delete('note-templates/:id')
  deleteGiftNoteTemplate(@Param('id') id: string) {
    return this.adminService.deleteGiftNoteTemplate(id);
  }

  @Post('note-templates/seed')
  seedGiftNoteTemplates() {
    return this.adminService.seedDefaultGiftNoteTemplates();
  }

  // ─── Yorumlar ─────────────────────────────────────────────────────────────
  @Get('reviews')
  listReviews(@Query('approved') approved?: string) {
    const val = approved === 'true' ? true : approved === 'false' ? false : undefined;
    return this.adminService.listReviews(val);
  }

  @Patch('reviews/:id/approve')
  approveReview(@Param('id') id: string, @Body() body: { approved: boolean }) {
    return this.adminService.approveReview(id, body.approved);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  // ─── Bannerlar ────────────────────────────────────────────────────────────
  @Get('banners')
  listBanners() {
    return this.adminService.listBanners();
  }

  @Post('banners')
  createBanner(@Body() body: any) {
    return this.adminService.createBanner(body);
  }

  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateBanner(id, body);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string) {
    return this.adminService.deleteBanner(id);
  }

  // ─── İade Talepleri ───────────────────────────────────────────────────────
  @Get('returns')
  listReturns() {
    return this.adminService.listReturns();
  }

  @Patch('returns/:id/status')
  updateReturnStatus(@Param('id') id: string, @Body() body: { status: any; adminNote?: string }) {
    return this.adminService.updateReturnStatus(id, body.status, body.adminNote);
  }

  // ─── Raporlar ─────────────────────────────────────────────────────────────
  @Get('reports')
  reports(@Query('period') period?: string) {
    return this.adminService.getReports(period);
  }

  @Get('reports/z')
  zReport(@Query('date') date?: string, @Query('period') period?: string) {
    return this.adminService.getCashZReport(date, period);
  }
}
