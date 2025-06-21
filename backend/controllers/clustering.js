const { spawn } = require("child_process");

function runPythonScript(data) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python3", ["scripts/clustering.py"]);
      let output = "";
      let errorOutput = "";
  
      pythonProcess.stdout.on("data", (chunk) => {
        output += chunk.toString();
      });
  
      pythonProcess.stderr.on("data", (chunk) => {
        errorOutput += chunk.toString();
      });
  
      pythonProcess.on("close", (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (err) {
            reject(new Error("Invalid JSON from Python: " + err.message));
          }
        } else {
          reject(new Error("Python script failed: " + errorOutput));
        }
      });
  
      pythonProcess.stdin.write(JSON.stringify(data));
      pythonProcess.stdin.end();
    });
}

exports.clustering = async (req, res) => {
    try {
      const data = req.body;
      const result = await runPythonScript(data); // a function returning a Promise
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  