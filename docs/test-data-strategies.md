# Test Data Strategies

## Introduction

Effective test data management is crucial for maintaining reliable and maintainable test suites. This document outlines strategies to:

- Ensure test isolation and reproducibility
- Reduce test flakiness and false positives
- Improve test execution speed
- Enable parallel test execution
- Facilitate easier test maintenance

The strategies presented here are particularly important for our BFF layer, where test data dependencies can significantly impact test reliability and development velocity.

## Key considerations

1. Current test data dependencies between operations
2. Strategies to isolate test data per operation

First, we examine the Postman collection to understand how test data is currently shared between operations.

## Implementation Priority Matrix

| Strategy | Complexity | Benefit | Recommended Order | Reasoning |
|----------|------------|---------|-------------------|-----------|
| Unique Identifiers | Low | High | 1st | Easy wins with immediate isolation benefits |
| Test Data Cleanup | Medium | High | 2nd | Critical for test reliability |
| Pre-request Scripts | High | Medium | 3rd | Complex but enables true independence |
| Mock Servers | High | Medium | 4th | Useful for specific scenarios |

## Potential strategies to make Categories Postman collection operations independent regarding test data

1. Unique Identifiers per Operation

- Generate unique identifiers (UUIDs) for each test entity created
- Use dynamic variables to ensure each operation creates/uses distinct data
- Example: Use Postman's dynamic variables like {{$guid}} for unique names/IDs

2. Test Data Isolation via Pre-request Scripts

- Add pre-request scripts to generate required test data
- Clean up created data in test scripts
- Example: Create test category before each operation that needs it, then delete it after

### Detailed Pre-request Script Example

```javascript
// Example: Creating test data for category operations
const categoryData = {
  name: `TestCategory-{{$guid}}`,
  description: "Automatically generated test category"
};

pm.variables.set("testCategory", JSON.stringify(categoryData));
pm.sendRequest({
  url: `${pm.environment.get("BASE_URL")}/categories`,
  method: 'POST',
  header: {
    'Content-Type': 'application/json'
  },
  body: {
    mode: 'raw',
    raw: JSON.stringify(categoryData)
  }
}, function (err, res) {
  pm.expect(err).to.be.null;
  pm.expect(res.code).to.be.oneOf([200, 201]);
  pm.variables.set("createdCategoryId", res.json().id);
});
```

3. Environment Variable Management

- Use separate environment variables for each operation
- Reset variables between operations
- Example: Store operation-specific IDs in distinct environment variables

4. Data Partitioning

- Use unique prefixes/suffixes for test data
- Example: Append operation name or timestamp to test data names

5. Test Data Cleanup Strategy

- Implement comprehensive cleanup in collection-level scripts
- Delete all test data created during test execution
- Example: Track created entities and delete them in a teardown script

6. Mock Server Integration

- Use Postman mock servers for independent test data
- Configure mock responses for each operation
- Example: Set up mock endpoints that return predefined responses

7. Data Sandboxing

- Create separate test environments for each operation
- Use different database instances or schemas
- Example: Spin up temporary databases for test execution

8. Operation Grouping

- Organize operations into independent groups
- Use separate folders with their own test data
- Example: Group CRUD operations for different entity types

## Handling Invalid Data Cases

### Negative Test Data Strategy

1. Create negative test data sets:
   - Malformed UUIDs for ID parameters
   - Numeric values exceeding database constraints
   - Missing required relationships (e.g., holdings without portfolio)

2. Error Response Schema Validation:

```javascript
pm.test("Validate error schema", function() {
    pm.response.to.have.jsonSchema({
        type: "object",
        required: ["error"],
        properties: {
            error: {
                type: "object",
                required: ["code", "message"],
                properties: {
                    code: {type: "number"},
                    message: {type: "string"}
                }
            }
        }
    });
});
```

### BFF-Specific Example Implementation

Example implementation for Holdings Service data isolation:

```javascript
// In Postman pre-request script for GET /holdings/{id}
const holdingId = pm.variables.replaceIn('holding-{{$guid}}');
pm.environment.set('testHoldingId', holdingId);

// In test script after POST /holdings
pm.test("Cleanup holding", function() {
    pm.sendRequest({
        url: `${pm.environment.get("BASE_URL")}/holdings/${pm.environment.get("testHoldingId")}`,
        method: 'DELETE'
    });
});
```

## Test Data Versioning

### Directory Structure

```bash
/bff/tests/test-data/
├── v1/
│   ├── holdings/
│   └── portfolios/
└── v2/
    ├── holdings/
    └── portfolios/
```

### Version Control Integration

```json
{
    "variable": [
        {
            "key": "apiVersion",
            "value": "v1",
            "type": "string"
        }
    ]
}
```

## Implementation Plan

1. Phase 1: Foundation
   - Implement unique identifiers across all collections
   - Set up basic cleanup scripts
   - Create test data version directories

2. Phase 2: Enhanced Isolation
   - Add pre-request scripts for test data setup
   - Implement comprehensive cleanup strategy
   - Set up error case test data

3. Phase 3: Advanced Features
   - Configure mock servers for read-only operations
   - Implement data versioning
   - Add schema validation for all responses

4. Phase 4: Monitoring & Maintenance (Ongoing)
   - Monitor test execution times
   - Review and update test data sets
   - Maintain version compatibility

## Monitoring and Metrics

To ensure the effectiveness of our test data strategies, we should track:

1. Test Execution Metrics:

- Test execution time before/after implementation
- Number of flaky tests
- Test failure rates

2. Data Management Metrics:

- Number of test data collisions
- Time spent on test data maintenance
- Test data cleanup success rate

3. Quality Metrics:

- Defect detection rate
- Test coverage
- Mean time to detect failures

Example monitoring dashboard configuration:

```yaml
metrics:
  - name: test_execution_time
    query: >
      SELECT percentile_disc(0.95) WITHIN GROUP (ORDER BY duration)
      FROM test_runs
      WHERE timestamp > now() - interval '1 day'
  
  - name: test_failure_rate
    query: >
      SELECT count(*) FILTER (WHERE status = 'failed') * 1.0 / count(*)
      FROM test_runs
      WHERE timestamp > now() - interval '1 day'
```

## Glossary

- **Test Data Isolation**: Ensuring tests don't share or interfere with each other's data
- **Pre-request Script**: Code executed before an API request to set up test conditions
- **Mock Server**: Simulated API server that returns predefined responses
- **Data Sandboxing**: Creating isolated environments for test execution
- **Test Data Versioning**: Managing different versions of test data sets
- **Flaky Test**: A test that exhibits both passing and failing results without code changes

## Conclusion

The best approach would likely combine several of these strategies. For example:

- Use unique identifiers and dynamic variables for data creation
- Implement comprehensive cleanup scripts
- Utilize environment variables effectively
- Consider mock servers for read-only operations

The implementation plan provides a structured approach to gradually improve test data management while maintaining existing test stability.
