const fs = require('fs');
const path = require('path');

describe('迁移验证测试', () => {
  const srcDir = path.join(__dirname, '../src');
  const publicDir = path.join(__dirname, '../public');
  
  describe('1. 源文件结构验证', () => {
    test('src 目录存在', () => {
      expect(fs.existsSync(srcDir)).toBe(true);
    });
    
    test('src/index.html 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'index.html'))).toBe(true);
    });
    
    test('src/scripts/main.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/main.js'))).toBe(true);
    });
    
    test('src/scripts/services/storageService.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/services/storageService.js'))).toBe(true);
    });
    
    test('src/scripts/services/calculationService.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/services/calculationService.js'))).toBe(true);
    });
    
    test('src/scripts/modules/dashboard.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/modules/dashboard.js'))).toBe(true);
    });
    
    test('src/scripts/modules/health.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/modules/health.js'))).toBe(true);
    });
    
    test('src/scripts/modules/fireGoal.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/modules/fireGoal.js'))).toBe(true);
    });
    
    test('src/scripts/modules/incomeRecords.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/modules/incomeRecords.js'))).toBe(true);
    });
    
    test('src/scripts/utils/formatters.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/utils/formatters.js'))).toBe(true);
    });
    
    test('src/scripts/utils/validators.js 存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'scripts/utils/validators.js'))).toBe(true);
    });
    
    test('src/assets 目录存在', () => {
      expect(fs.existsSync(path.join(srcDir, 'assets'))).toBe(true);
    });
  });

  describe('2. HTML 引用验证', () => {
    let htmlContent;
    
    beforeAll(() => {
      htmlContent = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
    });
    
    test('HTML 引用 storageService.js', () => {
      expect(htmlContent).toContain('./scripts/services/storageService.js');
    });
    
    test('HTML 引用 calculationService.js', () => {
      expect(htmlContent).toContain('./scripts/services/calculationService.js');
    });
    
    test('HTML 引用 formatters.js', () => {
      expect(htmlContent).toContain('./scripts/utils/formatters.js');
    });
    
    test('HTML 引用 validators.js', () => {
      expect(htmlContent).toContain('./scripts/utils/validators.js');
    });
    
    test('HTML 引用 main.js', () => {
      expect(htmlContent).toContain('./scripts/main.js');
    });
  });

  describe('3. 构建产物验证', () => {
    test('public 目录存在', () => {
      expect(fs.existsSync(publicDir)).toBe(true);
    });
    
    test('public/index.html 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'index.html'))).toBe(true);
    });
    
    test('public/scripts/main.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/main.js'))).toBe(true);
    });
    
    test('public/scripts/services/storageService.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/services/storageService.js'))).toBe(true);
    });
    
    test('public/scripts/services/calculationService.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/services/calculationService.js'))).toBe(true);
    });
    
    test('public/scripts/modules/dashboard.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/modules/dashboard.js'))).toBe(true);
    });
    
    test('public/scripts/modules/health.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/modules/health.js'))).toBe(true);
    });
    
    test('public/scripts/modules/fireGoal.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/modules/fireGoal.js'))).toBe(true);
    });
    
    test('public/scripts/modules/incomeRecords.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/modules/incomeRecords.js'))).toBe(true);
    });
    
    test('public/scripts/utils/formatters.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/utils/formatters.js'))).toBe(true);
    });
    
    test('public/scripts/utils/validators.js 存在', () => {
      expect(fs.existsSync(path.join(publicDir, 'scripts/utils/validators.js'))).toBe(true);
    });
    
    test('public 与 src 中 storageService.js 内容一致', () => {
      const srcContent = fs.readFileSync(path.join(srcDir, 'scripts/services/storageService.js'), 'utf8');
      const publicContent = fs.readFileSync(path.join(publicDir, 'scripts/services/storageService.js'), 'utf8');
      expect(publicContent).toBe(srcContent);
    });
    
    test('public 与 src 中 calculationService.js 内容一致', () => {
      const srcContent = fs.readFileSync(path.join(srcDir, 'scripts/services/calculationService.js'), 'utf8');
      const publicContent = fs.readFileSync(path.join(publicDir, 'scripts/services/calculationService.js'), 'utf8');
      expect(publicContent).toBe(srcContent);
    });
  });

  describe('4. 文档验证', () => {
    test('README.md 存在', () => {
      const readmePath = path.join(__dirname, '../README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });
    
    test('docs/product-spec.md 存在', () => {
      const docPath = path.join(__dirname, '../docs/product-spec.md');
      expect(fs.existsSync(docPath)).toBe(true);
    });
    
    test('docs/technical-design.md 存在', () => {
      const docPath = path.join(__dirname, '../docs/technical-design.md');
      expect(fs.existsSync(docPath)).toBe(true);
    });
    
    test('docs/acceptance-checklist.md 存在', () => {
      const docPath = path.join(__dirname, '../docs/acceptance-checklist.md');
      expect(fs.existsSync(docPath)).toBe(true);
    });
  });

  describe('5. 旧文件清理验证', () => {
    test('旧版 public/js 目录不应存在', () => {
      const oldPath = path.join(__dirname, '../public/js');
      expect(fs.existsSync(oldPath)).toBe(false);
    });
    
    test('旧版 src/js 目录不应存在', () => {
      const oldPath = path.join(__dirname, '../src/js');
      expect(fs.existsSync(oldPath)).toBe(false);
    });
  });
});