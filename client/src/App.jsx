import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import boilerPlate from "./boilerPlate";
import moment from "moment";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
ace.config.set('basePath', 'path-to-ace');


function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState("java");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  useEffect(() => {
    setCode(boilerPlate[language]);

    setJobId("");
    setStatus("");
    setResult("");

    setJobDetails("");
  }, [language]);

  async function handleSubmit() {
    console.log(code);

    const payLoad = {
      language,
      code,
    };

    try {
      const ans = await axios.post("http://localhost:5000/run", payLoad);
      console.log(ans);
      setJobId(ans.data.jobId);

      let interval = setInterval(async () => {
        const { data: statusRes } = await axios.get(
          "http://localhost:5000/status",
          {
            params: { id: ans.data.jobId },
          }
        );
        const { success, job, error } = statusRes;
        console.log(statusRes);

        if (success) {
          const { status: jobStatus, output: jobOutput } = job;
          setStatus(jobStatus);
          setJobDetails(job);
          if (jobStatus === "pending") return;
          setResult(jobOutput);
          clearInterval(interval);
        } else {
          console.error(error);
          setResult(error);
          setStatus("Bad request");
          clearInterval(interval);
        }
      }, 1000);
    } catch ({ response }) {
      if (response) {
        const errorMessage = response.data.stderr;
        setResult(errorMessage);
      } else {
        setResult("Something went wrong");
      }
    }
  }

  const renderTimeDetails = () => {
    if (!jobDetails) {
      return "";
    }
    let { submittedAt, startedAt, completedAt } = jobDetails;
    let result = "";
    submittedAt = moment(submittedAt).toString();
    result += `Job Submitted At: ${submittedAt}  `;
    if (!startedAt || !completedAt) return result;
    const start = moment(startedAt);
    const end = moment(completedAt);
    const diff = end.diff(start, "seconds", true);
    result += `Execution Time: ${diff}s`;
    return result;
  };

  return (
    <>
      <div>
        <h2>Code Compiler</h2>
        <div>
          <select
            value={language}
            onChange={(e) => {
              let response = window.confirm(
                "Waring : if you change the language, all of your previous code will be deleted"
              );
              if (response) {
                setLanguage(e.target.value);
                console.log(e.target.value);
              }
            }}
          >
            <option value="java">Java</option>
            <option value="py">Python</option>
            <option value="js">Javascript</option>
          </select>
        </div>
        {/* <textarea
          name=""
          id=""
          cols="80"
          rows="20"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
          }}
        ></textarea> */}

        <AceEditor
          className="ace-editor"
          value={code}
          mode={language === 'js'?'javascript':(language==='py'?'python':'java')}
          theme="monokai"
          fontSize="16px"
          highlightActiveLine={true}
          setOptions={{
            enableLiveAutocompletion: true,
            showLineNumbers: true,
            tabSize: 2,
          }}
          onChange={(newCode) => setCode(newCode)}
        />

        <div>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      </div>
      <p>{status}</p>
      <p>{jobId ? `Job ID: ${jobId}` : ""}</p>
      <p>{result}</p>
      <p>{renderTimeDetails()}</p>
    </>
  );
}

export default App;
