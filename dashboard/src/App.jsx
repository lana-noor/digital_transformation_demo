import { useEffect, useMemo, useState } from "react";

function parseRoute() {
  const hash = window.location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);

  if (parts[0] === "employee" && parts[1]) {
    return { view: "employee", employeeId: parts[1] };
  }

  return { view: "team", employeeId: null };
}

function statusClass(status) {
  if (status === "APPROVED") return "status approved";
  if (status === "NEEDS REVIEW") return "status review";
  return "status rejected";
}

function currency(value) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function TeamView({ data, search, setSearch, statusFilter, setStatusFilter }) {
  const employees = data?.employees ?? [];

  const filtered = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        employee.designation.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" || employee.overallStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  const approvedCount = employees.filter(
    (employee) => employee.overallStatus === "APPROVED"
  ).length;
  const reviewCount = employees.filter(
    (employee) => employee.overallStatus === "NEEDS REVIEW"
  ).length;
  const rejectedCount = employees.filter(
    (employee) => employee.overallStatus === "REJECTED"
  ).length;

  const highestVariation = [...employees]
    .sort((a, b) => b.maxVariationPercent - a.maxVariationPercent)
    .slice(0, 3);

  return (
    <>
      <header className="hero">
        <p className="kicker">Agent 3 Output</p>
        <h1>Team Salary Slip Verification Dashboard</h1>
        <p className="subtitle">
          Team-level summary of verification outcomes with direct drill-down
          links to each employee summary.
        </p>
        <div className="meta-row">
          <span>Generated: {formatDate((data?.generatedOn || "").slice(0, 10))}</span>
          <span>Total employees: {employees.length}</span>
        </div>
      </header>

      <section className="kpi-grid">
        <article className="kpi-card">
          <h2>Approved</h2>
          <p>{approvedCount}</p>
        </article>
        <article className="kpi-card review">
          <h2>Needs Review</h2>
          <p>{reviewCount}</p>
        </article>
        <article className="kpi-card rejected">
          <h2>Rejected</h2>
          <p>{rejectedCount}</p>
        </article>
        <article className="kpi-card">
          <h2>Largest Variation</h2>
          <p>{highestVariation[0]?.maxVariationPercent?.toFixed(2) || "0.00"}%</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Team Findings</h2>
          <div className="controls">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee, ID, designation"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="NEEDS REVIEW">Needs Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Latest Pay</th>
                <th>Max Variation</th>
                <th>Status</th>
                <th>Recommendation</th>
                <th>Summary Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.employeeId}>
                  <td>
                    <strong>{employee.employeeName}</strong>
                    <div className="subtext">
                      {employee.employeeId} - {employee.designation}
                    </div>
                  </td>
                  <td>
                    {currency(employee.latestIncomeAed)}
                    <div className="subtext">{formatDate(employee.latestPayDate)}</div>
                  </td>
                  <td>{employee.maxVariationPercent.toFixed(2)}%</td>
                  <td>
                    <span className={statusClass(employee.overallStatus)}>
                      {employee.overallStatus}
                    </span>
                  </td>
                  <td>{employee.recommendation}</td>
                  <td>
                    <a href={employee.employeeSummaryPath} className="summary-link">
                      Open Summary
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Watchlist: Highest Salary Movement</h2>
        <div className="watchlist">
          {highestVariation.map((employee) => (
            <a
              key={employee.employeeId}
              className="watch-card"
              href={employee.employeeSummaryPath}
            >
              <h3>{employee.employeeName}</h3>
              <p>{employee.employeeId}</p>
              <strong>{employee.maxVariationPercent.toFixed(2)}%</strong>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function EmployeeView({ employee }) {
  if (!employee) {
    return (
      <section className="panel">
        <h2>Employee Summary Not Found</h2>
        <a href="#/" className="summary-link">
          Return to Team Dashboard
        </a>
      </section>
    );
  }

  return (
    <>
      <header className="hero employee-hero">
        <a href="#/" className="summary-link back-link">
          Back to Team Dashboard
        </a>
        <p className="kicker">Employee Summary</p>
        <h1>{employee.employeeName}</h1>
        <p className="subtitle">
          {employee.employeeId} - {employee.designation}
        </p>
        <span className={statusClass(employee.overallStatus)}>
          {employee.overallStatus}
        </span>
      </header>

      <section className="panel split">
        <article>
          <h2>Final Decision</h2>
          <ul className="facts">
            <li>Document Valid: {employee.documentValid ? "Yes" : "No"}</li>
            <li>Salary Valid: {employee.salaryValid ? "Yes" : "No"}</li>
            <li>Latest Income: {currency(employee.latestIncomeAed)}</li>
            <li>Latest Pay Date: {formatDate(employee.latestPayDate)}</li>
            <li>Max Variation: {employee.maxVariationPercent.toFixed(2)}%</li>
          </ul>
        </article>
        <article>
          <h2>Recommendation</h2>
          <p>{employee.recommendation}</p>
          <h3>Validation Reasoning</h3>
          <ol>
            {employee.validationReasoning.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>
      </section>

      <section className="panel split">
        <article>
          <h2>Salary Timeline</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Pay Date</th>
                <th>Net Income</th>
              </tr>
            </thead>
            <tbody>
              {employee.incomeTimeline.map((point) => (
                <tr key={point.date}>
                  <td>{point.month}</td>
                  <td>{formatDate(point.date)}</td>
                  <td>{currency(point.incomeAed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article>
          <h2>Variation Analysis</h2>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Absolute (AED)</th>
                <th>Percent</th>
              </tr>
            </thead>
            <tbody>
              {employee.variationAnalysis.map((item) => (
                <tr key={`${item.period}-${item.fromDate}`}>
                  <td>{item.period}</td>
                  <td>{currency(item.absoluteAed)}</td>
                  <td>{item.percent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Source Files</h3>
          <ul className="source-list">
            {employee.sourceFiles.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}

export default function App() {
  const [route, setRoute] = useState(parseRoute());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    fetch("/data/agent3_team_summary.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load dashboard data: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => setData(payload))
      .catch((err) => setError(err.message));
  }, []);

  const selectedEmployee = useMemo(() => {
    if (!data || !route.employeeId) return null;
    return (
      data.employees.find((employee) => employee.employeeId === route.employeeId) ??
      null
    );
  }, [data, route.employeeId]);

  if (error) {
    return (
      <main className="app-shell">
        <p className="error">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="app-shell">
        <p className="loading">Loading Agent 3 dashboard...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {route.view === "team" ? (
        <TeamView
          data={data}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      ) : (
        <EmployeeView employee={selectedEmployee} />
      )}
    </main>
  );
}
