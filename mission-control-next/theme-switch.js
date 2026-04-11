const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/app');

const replacements = {
  'bg-slate-900': 'bg-white',
  'bg-slate-950': 'bg-slate-50',
  'text-white': 'text-slate-900',
  'text-slate-300': 'text-slate-600',
  'text-slate-400': 'text-slate-500',
  'border-slate-800': 'border-slate-200',
  'border-slate-700': 'border-slate-300',
  'cyan-400': 'cyan-600',
  'emerald-400': 'emerald-600',
  'rose-400': 'rose-600',
  'purple-400': 'purple-600',
  'orange-400': 'orange-600',
  'amber-400': 'amber-600',
  'blue-400': 'blue-600',
  'divide-slate-800': 'divide-slate-200',
  'divide-slate-700': 'divide-slate-300',
  'bg-slate-800': 'bg-slate-100',
  'hover:bg-slate-800': 'hover:bg-slate-100',
  'hover:bg-slate-700': 'hover:bg-slate-200',
  'hover:text-white': 'hover:text-slate-900'
};

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // we need to be careful not to replace text inside strings if it matches something else, but tailwind classes are space separated
      // A simple string replacement could work if we replace word boundaries or just global replace
      
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        // use regex to replace exact class names, not partial matches
        const regex = new RegExp(`(?<=[\\s"'\\\`])` + oldClass + `(?=[\\s"'\\\`])`, 'g');
        content = content.replace(regex, newClass);
        // Also handle cases where oldClass is at the very beginning or end, though unlikely in className strings
        const regex2 = new RegExp(`\\b` + oldClass + `\\b`, 'g');
        content = content.replace(regex2, newClass);
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated ${fullPath}`);
    }
  });
}

processDirectory(directoryPath);
