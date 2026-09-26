const tests = [
  { language: "python", code: "print('Python OK')" },
  { language: "js", code: "console.log('JS OK')" },
  { language: "go", code: 'package main\nimport "fmt"\nfunc main(){ fmt.Println("Go OK") }' },
  { language: "rust", code: 'fn main(){ println!("Rust OK"); }' },
  { language: "java", code: 'class Main{ public static void main(String[] a){ System.out.println("Java OK"); } }', files: [{ path: "Main.java", content: 'class Main{ public static void main(String[] a){ System.out.println("Java OK"); } }' }] },
  { language: "c", code: '#include <stdio.h>\nint main(){ printf("C OK\\n"); return 0; }' },
  { language: "cpp", code: '#include <iostream>\nint main(){ std::cout << "C++ OK"; }' },
  { language: "php", code: '<?php echo "PHP OK"; ?>' },
  { language: "ruby", code: 'puts "Ruby OK"' },
  { language: "kotlin", code: 'fun main(){ println("Kotlin OK") }' },
  { language: "swift", code: 'print("Swift OK")' },
  { language: "dart", code: 'void main(){ print("Dart OK"); }' },
  { language: "perl", code: 'print "Perl OK\\n";' },
  { language: "lua", code: 'print("Lua OK")' },
  { language: "r", code: 'cat("R OK\\n")' },
  { language: "bash", code: 'echo "Bash OK"' },
  { language: "html", code: '<h1>HTML OK</h1>' },
  { language: "sql", code: "SELECT 'SQL OK';" },
  { language: "json", code: '{"test": "JSON OK"}' },
];

const BASE_URL = process.env.SANDBOX_URL || "http://localhost:3000/api/sandbox";

async function runOne(t) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "exec",
      language: t.language,
      code: t.code,
      files: t.files,
    }),
  });

  let result;
  try {
    result = await response.json();
  } catch {
    result = { ok: false, error: `HTTP ${response.status}: invalid JSON response` };
  }

  return { ...result, httpStatus: response.status };
}

async function runAll() {
  console.log("กำลังตรวจสอบ Sandbox: " + BASE_URL);
  const results = [];

  for (const t of tests) {
    try {
      const res = await runOne(t);
      const output = (res.stdout || res.output || res.stderr || res.error || "").trim().replace(/\s+/g, " ");
      const passed = res.ok === true;
      results.push({ language: t.language, passed, output, result: res });
      console.log(`[${passed ? "PASS" : "FAIL"}] ${t.language} -> ${output || "(no output)"}`);
    } catch (error) {
      results.push({ language: t.language, passed: false, output: error.message, result: null });
      console.log(`[FAIL] ${t.language} -> ${error.message}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  console.log(`Sandbox smoke test: ${passed}/${tests.length} passed`);

  if (passed !== tests.length) {
    console.log("หมายเหตุ: FAIL ของภาษาที่ runtime ยังไม่ได้ติดตั้งคือผลทดสอบจริง ไม่ควรนับเป็น PASS");
    process.exitCode = 1;
  }
}

runAll();
