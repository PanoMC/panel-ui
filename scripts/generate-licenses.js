import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function readPackageJson(path) {
  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

function getLicenseFromPackage(pkg) {
  if (pkg.license) {
    return typeof pkg.license === 'string' ? pkg.license : pkg.license.type || 'Unknown';
  }
  if (pkg.licenses) {
    return Array.isArray(pkg.licenses) 
      ? pkg.licenses.map(l => typeof l === 'string' ? l : l.type).join(', ')
      : 'Unknown';
  }
  return 'Unknown';
}

function getLicenseText(packagePath) {
  const licenseFiles = ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'LICENCE', 'LICENCE.txt', 'LICENCE.md'];
  
  for (const licenseFile of licenseFiles) {
    const licensePath = join(packagePath, licenseFile);
    if (existsSync(licensePath)) {
      try {
        return readFileSync(licensePath, 'utf-8').trim();
      } catch (e) {
        // Continue to next file
      }
    }
  }
  
  return null;
}

export function collectLicenses(outputDir = null) {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = readPackageJson(packageJsonPath);
  
  if (!packageJson) {
    throw new Error('package.json bulunamadı!');
  }

  const allDependencies = {
    ...packageJson.dependencies || {},
    ...packageJson.devDependencies || {}
  };

  const licenses = [];
  const nodeModulesPath = join(projectRoot, 'node_modules');

  for (const [packageName, version] of Object.entries(allDependencies)) {
    const packagePath = join(nodeModulesPath, packageName);
    const packageJsonPath = join(packagePath, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      console.warn(`Paket bulunamadı: ${packageName}`);
      continue;
    }

    const pkg = readPackageJson(packageJsonPath);
    if (!pkg) continue;

    const license = getLicenseFromPackage(pkg);
    const licenseText = getLicenseText(packagePath);
    const repository = pkg.repository 
      ? (typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url)
      : null;
    const homepage = pkg.homepage || repository;

    licenses.push({
      name: packageName,
      version: version,
      license: license,
      licenseText: licenseText,
      repository: repository,
      homepage: homepage,
      author: pkg.author 
        ? (typeof pkg.author === 'string' ? pkg.author : pkg.author.name)
        : null
    });
  }

  // Lisanslara göre sırala
  licenses.sort((a, b) => a.name.localeCompare(b.name));

  // Output path'i belirle
  let outputPath;
  if (outputDir) {
    // Build klasörüne kaydet (sadece build sırasında)
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    outputPath = join(outputDir, 'licenses.json');
  } else {
    // Ana dizine kaydet (npm run generate-licenses için)
    outputPath = join(projectRoot, 'licenses.json');
  }
  
  writeFileSync(outputPath, JSON.stringify(licenses, null, 2), 'utf-8');
  
  console.log(`✅ ${licenses.length} paketin lisans bilgisi toplandı ve ${outputPath} dosyasına kaydedildi.`);
}

// Eğer direkt çalıştırılıyorsa (npm run generate-licenses)
// Sadece script direkt çalıştırıldığında çalış, import edildiğinde çalışma
// import.meta.url'yi file:// ile karşılaştırarak kontrol et
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     (process.argv[1] && process.argv[1].endsWith('generate-licenses.js'));

if (isMainModule) {
  collectLicenses();
}

