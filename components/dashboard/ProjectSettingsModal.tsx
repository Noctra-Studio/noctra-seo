'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Loader2, Image as ImageIcon, Upload, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ProjectSettingsModalProps {
  project: { id: string; name: string; logo_url: string | null } | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProjectSettingsModal({ project, open, onClose, onUpdate }: ProjectSettingsModalProps) {
  const t = useTranslations('dashboard.settings');
  const [name, setName] = useState(project?.name || '');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(project?.logo_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  if (!open) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function handleSave() {
    if (!project) return;
    setSaving(true);

    try {
      let finalLogoUrl = project.logo_url;

      // 1. Upload file if selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${project.id}/${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-logos')
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-logos')
          .getPublicUrl(filePath);
        
        finalLogoUrl = publicUrl;
      }

      // 2. Update database
      const { error: dbError } = await supabase
        .from('projects')
        .update({ 
          name, 
          logo_url: finalLogoUrl 
        })
        .eq('id', project.id);

      if (dbError) throw dbError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Error: Asegúrate de que el bucket "project-logos" existe y es público en Supabase.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#14141C] border border-white/[0.05] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#F1F1F5] tracking-tight">{t('title')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-xl transition-colors">
            <X size={20} className="text-[#8B8B9A]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8B8B9A] uppercase tracking-widest">{t('nameLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0A0A0F] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[#F1F1F5] focus:outline-none focus:border-[#10B981] transition-all"
              placeholder={t('namePlaceholder')}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[#8B8B9A] uppercase tracking-widest">{t('logoLabel')}</label>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative w-full h-40 bg-[#0A0A0F] border-2 border-dashed border-white/[0.05] rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:border-[#10B98150] hover:bg-[#10B98105]",
                logoFile && "border-[#10B98130] bg-[#10B98105]"
              )}
            >
              {previewUrl ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl group-hover:scale-105 transition-transform">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={20} className="text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-2xl bg-white/[0.02] text-[#4B4B5A] group-hover:text-[#10B981] transition-colors">
                    <ImageIcon size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#8B8B9A] group-hover:text-[#F1F1F5] transition-colors">{t('upload')}</p>
                    <p className="text-[10px] text-[#4B4B5A] mt-1">{t('formats')}</p>
                  </div>
                </>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
            
            {logoFile && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#10B98110] border border-[#10B98120] rounded-lg">
                <Check size={12} className="text-[#10B981]" />
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider">{t('ready', { name: logoFile.name })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-white/[0.01] border-t border-white/[0.05] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/[0.05] text-sm font-bold text-[#8B8B9A] hover:bg-white/[0.05] transition-all"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl bg-[#10B981] text-sm font-bold text-black hover:bg-[#0D9469] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
