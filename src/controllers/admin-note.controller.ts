import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public';
import { AdminAuthGuard } from '../guards/admin-auth.guard';
import { AdminNoteService } from '../services/admin-note.service';
import { NoteListQueryDto } from '../pojo/dto/admin/admin-maintenance.dto';

@ApiTags('管理台-记事')
@Controller('admin/notes')
export class AdminNoteController {
  constructor(private readonly noteService: AdminNoteService) {}

  @ApiOperation({ summary: '某账本的分页记事列表（可按类型过滤）' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get()
  list(@Query() query: NoteListQueryDto) {
    return this.noteService.listNotes({
      bookId: query.bookId,
      type: query.type,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @ApiOperation({ summary: '记事详情' })
  @Public()
  @UseGuards(AdminAuthGuard)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.noteService.getNoteDetail(id);
  }
}
