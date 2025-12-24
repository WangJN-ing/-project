import React, { useState } from 'react';
import { Translation } from '../types';
import { Github, FileText, Mail, GraduationCap, Sparkles, ExternalLink, Check, Copy } from 'lucide-react';

interface FooterProps {
  t: Translation;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  const [emailCopied, setEmailCopied] = useState(false);

  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const email = "3381173206@qq.com";
    
    // 1. Copy to clipboard
    navigator.clipboard.writeText(email).then(() => {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000); // Reset after 2s
    });

    // 2. Try to open mail client as fallback
    window.location.href = `mailto:${email}`;
  };

  return (
    <footer className="mt-16 pt-12 pb-8 border-t border-slate-200/60">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Col 1: Brand & School (Span 4) */}
        <div className="md:col-span-4 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold tracking-widest uppercase border border-slate-200">
             BJTU Weihai 2025
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-sm mt-1">
                <GraduationCap size={20} className="text-sciblue-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{t.title}</h2>
                <p className="text-sm leading-relaxed text-slate-500 mt-1 max-w-xs">
                    {t.footer.school}
                </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-2 font-mono">{t.footer.version}</p>
        </div>

        {/* Col 2: Team (Span 3) */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.footer.team}</h3>
          <ul className="space-y-3 text-sm">
            {/* Wang Junning - Leader */}
            <li className="flex flex-col gap-1 group">
               <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform"></span>
                   <span className="text-slate-700 font-bold group-hover:text-sciblue-600 transition-colors">王骏宁 (Wang Junning)</span>
               </div>
               <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-600 px-1.5 py-0.5 rounded self-start ml-3.5">
                  {t.footer.role_leader}
               </span>
            </li>
            
            {/* Chen Che - Algo */}
            <li className="flex flex-col gap-1 group">
               <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-sciblue-400 group-hover:scale-125 transition-transform"></span>
                   <span className="text-slate-600 font-medium group-hover:text-sciblue-600 transition-colors">陈彻 (Chen Che)</span>
               </div>
               <span className="text-[10px] text-slate-400 ml-3.5">
                  {t.footer.role_algo}
               </span>
            </li>

            {/* Research Group */}
            <li className="pt-1">
               <div className="flex items-start gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"></span>
                   <div className="flex flex-col">
                       <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-0.5">{t.footer.role_research}</span>
                       <p className="text-slate-500 leading-relaxed text-xs">
                          申杰霖, 季唐羽, 欧一帅, 张子航
                       </p>
                   </div>
               </div>
            </li>
          </ul>
        </div>

        {/* Col 3: Supervisor & Ack (Span 3) */}
        <div className="md:col-span-3 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{t.footer.supervisor}</h3>
            <div className="flex items-center gap-3 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm inline-flex">
              <div className="bg-slate-50 p-1.5 rounded-full text-slate-400"><GraduationCap size={14}/></div>
              <span className="font-medium text-sm">赵翔 (Zhao Xiang)</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Acknowledgements</h3>
            <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100/50">
               <p className="flex items-start gap-2">
                  <Sparkles size={12} className="mt-0.5 text-amber-400 shrink-0"/>
                  <span>{t.footer.acknowledgement}</span>
               </p>
            </div>
          </div>
        </div>

        {/* Col 4: Links (Span 2) */}
        <div className="md:col-span-2 space-y-4">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.footer.links}</h3>
           <div className="flex flex-col gap-3">
              {/* GitHub Link */}
              <a 
                href="https://github.com/WangJN-ing/-project" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-black transition-colors group p-2 hover:bg-white rounded-lg -ml-2"
              >
                  <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm group-hover:border-slate-300 group-hover:scale-110 transition-all">
                    <Github size={16}/> 
                  </div>
                  <span>{t.footer.github}</span>
                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-50 transition-opacity ml-auto" />
              </a>
              
              {/* PDF Link */}
              <a 
                href="/Project_Report.pdf" 
                target="_blank" 
                rel="noopener noreferrer" 
                download="Project_Report.pdf"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-sciblue-600 transition-colors group p-2 hover:bg-white rounded-lg -ml-2"
              >
                  <div className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm group-hover:border-sciblue-200 group-hover:text-sciblue-500 group-hover:scale-110 transition-all">
                    <FileText size={16}/> 
                  </div>
                  <span>{t.footer.report}</span>
                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-50 transition-opacity ml-auto" />
              </a>

              {/* Contact Link - Enhanced with Copy Functionality */}
              <a 
                href="mailto:3381173206@qq.com" 
                onClick={handleEmailClick}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors group p-2 hover:bg-white rounded-lg -ml-2 cursor-pointer"
                title="3381173206@qq.com (点击复制)"
              >
                  <div className={`
                    p-1.5 bg-white border rounded-md shadow-sm transition-all duration-300
                    ${emailCopied 
                        ? 'border-emerald-200 text-emerald-500 scale-110 bg-emerald-50' 
                        : 'border-slate-200 group-hover:border-emerald-200 group-hover:text-emerald-500 group-hover:scale-110'
                    }
                  `}>
                    {emailCopied ? <Check size={16}/> : <Mail size={16}/>}
                  </div>
                  <span className={`transition-all ${emailCopied ? 'text-emerald-600 font-bold' : ''}`}>
                    {emailCopied ? "邮箱已复制!" : t.footer.contact}
                  </span>
                  {!emailCopied && <Copy size={10} className="opacity-0 group-hover:opacity-40 transition-opacity ml-auto" />}
              </a>
           </div>
        </div>

      </div>
      
      <div className="mt-12 pt-6 border-t border-slate-100 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400">
        <p>© 2025 Hard Sphere Project. All rights reserved.</p>
        <p className="mt-2 md:mt-0 font-medium tracking-wide">
           {t.footer.designedBy}
        </p>
      </div>
    </footer>
  );
};

export default Footer;