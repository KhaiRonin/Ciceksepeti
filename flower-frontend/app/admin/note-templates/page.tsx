'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminGiftNoteTemplateService } from '@/services/dashboard.service';
import { AdminGiftNoteTemplate } from '@/types/admin';
import { GIFT_NOTE_RECIPIENT_OPTIONS, GiftNoteRecipientType, getGiftNoteRecipientLabel } from '@/lib/gift-note';

const templateSchema = z.object({
  recipientType: z.string().min(1, 'Alıcı tipi seçin'),
  content: z.string().min(8, 'Not en az 8 karakter olmalı'),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type TemplateForm = z.infer<typeof templateSchema>;

export default function AdminNoteTemplatesPage() {
  const qc = useQueryClient();
  const [selectedRecipient, setSelectedRecipient] = useState<'ALL' | GiftNoteRecipientType>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGiftNoteTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [autoSeedTried, setAutoSeedTried] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-note-templates'],
    queryFn: () => adminGiftNoteTemplateService.getAll(),
  });

  const filteredTemplates = useMemo(() => {
    if (selectedRecipient === 'ALL') return templates;
    return templates.filter((template) => template.recipientType === selectedRecipient);
  }, [selectedRecipient, templates]);

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      recipientType: 'SEVGILI',
      content: '',
      sortOrder: 0,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: adminGiftNoteTemplateService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-note-templates'] });
      toast.success('Not şablonu eklendi');
      handleDialogClose();
    },
    onError: () => toast.error('Not şablonu eklenemedi'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TemplateForm> }) =>
      adminGiftNoteTemplateService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-note-templates'] });
      toast.success('Not şablonu güncellendi');
      handleDialogClose();
    },
    onError: () => toast.error('Not şablonu güncellenemedi'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminGiftNoteTemplateService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-note-templates'] });
      toast.success('Not şablonu silindi');
      setDeleteId(null);
    },
    onError: () => toast.error('Not şablonu silinemedi'),
  });

  const seedMutation = useMutation({
    mutationFn: adminGiftNoteTemplateService.seedDefaults,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin-note-templates'] });
      if (result.created > 0) {
        toast.success(`${result.created} hazır not şablonu eklendi`);
      }
    },
    onError: () => toast.error('Hazır şablonlar yüklenemedi'),
  });

  useEffect(() => {
    if (isLoading || autoSeedTried) return;

    setAutoSeedTried(true);
    seedMutation.mutate();
  }, [autoSeedTried, isLoading, seedMutation]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminGiftNoteTemplateService.update(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-note-templates'] });
    },
  });

  function handleCreate() {
    setEditing(null);
    form.reset({
      recipientType: selectedRecipient === 'ALL' ? 'SEVGILI' : selectedRecipient,
      content: '',
      sortOrder: templates.length,
      isActive: true,
    });
    setDialogOpen(true);
  }

  function handleEdit(template: AdminGiftNoteTemplate) {
    setEditing(template);
    form.reset({
      recipientType: template.recipientType,
      content: template.content,
      sortOrder: template.sortOrder,
      isActive: template.isActive,
    });
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditing(null);
  }

  function onSubmit(values: TemplateForm) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: values });
      return;
    }

    createMutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Not Şablonları</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Alıcı tipine göre hazır notları yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni Şablon
          </Button>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtre</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-w-xs">
            <Select value={selectedRecipient} onValueChange={(v) => setSelectedRecipient(v as 'ALL' | GiftNoteRecipientType)}>
              <SelectTrigger>
                <SelectValue placeholder="Alıcı tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm alıcı tipleri</SelectItem>
                {GIFT_NOTE_RECIPIENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Şablon Listesi ({filteredTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Yükleniyor...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Bu filtrede şablon bulunamadı.
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-border/70 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getGiftNoteRecipientLabel(template.recipientType)}</Badge>
                    <Badge variant={template.isActive ? 'default' : 'outline'}>
                      {template.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Sıra: {template.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleMutation.mutate({ id: template.id, isActive: !template.isActive })
                      }
                    >
                      {template.isActive ? 'Pasife Al' : 'Aktif Et'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-6">{template.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Not Şablonu Düzenle' : 'Yeni Not Şablonu'}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="recipientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alıcı Tipi</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alıcı tipi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {GIFT_NOTE_RECIPIENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Not Metni</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} placeholder="Not şablonunu girin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıra</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2">
                      <FormLabel className="m-0 text-sm font-normal">Aktif</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  İptal
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? 'Güncelle' : 'Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Not şablonunu sil"
        description="Bu şablonu silmek istediğinize emin misiniz?"
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
