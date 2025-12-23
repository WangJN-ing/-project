import React from 'react';
import { Translation } from '../types';
import { Github, FileText, Mail, GraduationCap, Sparkles } from 'lucide-react';

interface FooterProps {
  t: Translation;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 md:py-16 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Col 1: Brand & School (Span 4) */}
        <div className="md:col-span-4 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-sciblue-400 text-[10px] font-bold tracking-widest uppercase border border-slate-700">
             BJTU Weihai 2025
          </div>
          
          {/* Brand Logo & Title Area - Using Remote URL */}
          <div className="flex items-start gap-4">
            <img 
               src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Beijing_Jiaotong_University_Logo.svg" 
               alt="School Logo" 
               className="w-12 h-12 object-contain brightness-0 invert opacity-90 mt-1"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
            <div>
                <h2 className="text-2xl font-bold text-slate-100 tracking-tight leading-tight">{t.title}</h2>
                <p className="text-sm leading-relaxed text-slate-400 mt-2 max-w-xs">
                    {t.footer.school}
                </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2">{t.footer.version}</p>
        </div>

        {/* Col 2: Team (Span 3 - Adjusted to give more space to next col) */}
        <div className="md:col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">{t.footer.team}</h3>
          <ul className="space-y-4 text-sm">
            {/* Wang Junning - Leader */}
            <li className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                   <span className="text-slate-100 font-bold text-base">王骏宁 (Wang Junning)</span>
               </div>
               <span className="text-xs bg-slate-800/80 border border-slate-700/50 text-amber-500 px-2 py-0.5 rounded self-start ml-4">
                  {t.footer.role_leader}
               </span>
            </li>
            
            {/* Chen Che - Algo */}
            <li className="flex flex-col gap-1">
               <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-sciblue-500"></span>
                   <span className="text-slate-200 font-medium">陈彻 (Chen Che)</span>
               </div>
               <span className="text-xs text-slate-400 ml-3.5">
                  {t.footer.role_algo}
               </span>
            </li>

            {/* Research Group */}
            <li className="pt-2">
               <div className="flex items-start gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5"></span>
                   <div className="flex flex-col">
                       <span className="text-xs text-slate-400 uppercase font-bold tracking-wide mb-1">{t.footer.role_research}</span>
                       <p className="text-slate-300 leading-relaxed text-xs">
                          申杰霖 (Shen Jielin), 季唐宇 (Ji Tangyu), <br/>
                          欧一帅 (Ou Yishuai), 张子航 (Zhang Zihang)
                       </p>
                   </div>
               </div>
            </li>
          </ul>
        </div>

        {/* Col 3: Supervisor & Ack (Span 3 - Increased for better spacing) */}
        <div className="md:col-span-3 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-3">{t.footer.supervisor}</h3>
            <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 inline-flex">
              <div className="bg-slate-700 p-1.5 rounded-full text-slate-300"><GraduationCap size={16}/></div>
              <span className="font-medium text-sm">赵翔 (Zhao Xiang)</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-2">Acknowledgements</h3>
            <div className="text-xs text-slate-400 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
               <p className="flex items-start gap-2">
                  <Sparkles size={12} className="mt-0.5 text-sciblue-400 shrink-0"/>
                  <span>Special thanks to AI assistants <strong>Google Gemini</strong> & <strong>OpenAI ChatGPT</strong> for development support.</span>
               </p>
            </div>
          </div>
        </div>

        {/* Col 4: Links (Span 2) */}
        <div className="md:col-span-2 space-y-4">
           <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">Links</h3>
           <div className="flex flex-col gap-4">
              {/* GitHub Link */}
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <Github size={16}/> <span>GitHub Repo</span>
              </a>
              
              {/* PDF Link */}
              <a href="/Project_Report.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <FileText size={16}/> <span>View Report (PDF)</span>
              </a>

              {/* Contact Link */}
              <a href="mailto:3381173206@qq.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group">
                  <Mail size={16} className="group-hover:text-sciblue-400 transition-colors"/> <span>Contact Leader</span>
              </a>
           </div>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
        <p>© 2025 Hard Sphere Project. All rights reserved.</p>
        <p className="mt-2 md:mt-0 text-slate-400 hover:text-white transition-colors cursor-default font-medium tracking-wide">
           Designed by Wang Junning
        </p>
      </div>
    </footer>
  );
};

export default Footer;