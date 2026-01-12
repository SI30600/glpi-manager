#!/usr/bin/env python3
"""
GLPI Manager Backend API Testing Suite
Tests all backend endpoints with demo data
"""

import requests
import sys
import json
from datetime import datetime

class GLPIBackendTester:
    def __init__(self, base_url="https://glpi-win-tool.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, expected_keys=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response type: {type(response_data)}")
                    
                    # Check expected keys if provided
                    if expected_keys and isinstance(response_data, dict):
                        for key in expected_keys:
                            if key not in response_data:
                                success = False
                                print(f"   ❌ Missing expected key: {key}")
                                break
                        else:
                            print(f"   ✅ All expected keys present: {expected_keys}")
                    
                    if success:
                        self.tests_passed += 1
                        print(f"✅ {name} - PASSED")
                        return True, response_data
                    else:
                        self.failed_tests.append(f"{name} - Missing keys")
                        print(f"❌ {name} - FAILED (Missing keys)")
                        return False, response_data
                        
                except json.JSONDecodeError:
                    print(f"   ❌ Invalid JSON response")
                    self.failed_tests.append(f"{name} - Invalid JSON")
                    print(f"❌ {name} - FAILED (Invalid JSON)")
                    return False, {}
            else:
                self.failed_tests.append(f"{name} - Status {response.status_code}")
                print(f"❌ {name} - FAILED (Expected {expected_status}, got {response.status_code})")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error text: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            self.failed_tests.append(f"{name} - Timeout")
            print(f"❌ {name} - FAILED (Timeout)")
            return False, {}
        except Exception as e:
            self.failed_tests.append(f"{name} - {str(e)}")
            print(f"❌ {name} - FAILED (Error: {str(e)})")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        # Test root endpoint
        self.run_test("Root API", "GET", "", 200, expected_keys=["message"])
        
        # Test health check
        self.run_test("Health Check", "GET", "health", 200, expected_keys=["status"])

    def test_glpi_connection(self):
        """Test GLPI connection endpoint"""
        print("\n" + "="*50)
        print("TESTING GLPI CONNECTION")
        print("="*50)
        
        success, data = self.run_test("GLPI Connection Test", "GET", "glpi/test-connection", 200, expected_keys=["status"])
        if success and data.get("status") == "demo":
            print("   ✅ Demo mode confirmed")
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATS")
        print("="*50)
        
        expected_keys = [
            "total_computers", "total_software", "total_monitors", 
            "total_printers", "total_network_devices", "total_phones",
            "computers_by_status", "recent_updates"
        ]
        
        success, data = self.run_test("Dashboard Stats", "GET", "glpi/stats", 200, expected_keys=expected_keys)
        
        if success:
            print(f"   📊 Computers: {data.get('total_computers', 0)}")
            print(f"   📊 Software: {data.get('total_software', 0)}")
            print(f"   📊 Monitors: {data.get('total_monitors', 0)}")
            print(f"   📊 Printers: {data.get('total_printers', 0)}")
            print(f"   📊 Network: {data.get('total_network_devices', 0)}")
            
            # Verify expected demo values
            expected_values = {
                "total_computers": 8,
                "total_software": 10,
                "total_monitors": 4,
                "total_printers": 3,
                "total_network_devices": 3
            }
            
            for key, expected in expected_values.items():
                actual = data.get(key, 0)
                if actual == expected:
                    print(f"   ✅ {key}: {actual} (matches expected)")
                else:
                    print(f"   ⚠️  {key}: {actual} (expected {expected})")
        
        return success

    def test_computers_endpoints(self):
        """Test computer-related endpoints"""
        print("\n" + "="*50)
        print("TESTING COMPUTERS ENDPOINTS")
        print("="*50)
        
        # Test computers list
        success, data = self.run_test("Computers List", "GET", "glpi/computers", 200, expected_keys=["data", "total"])
        
        if success:
            computers = data.get("data", [])
            total = data.get("total", 0)
            print(f"   📋 Found {len(computers)} computers (total: {total})")
            
            if computers:
                # Test computer details for first computer
                first_computer = computers[0]
                computer_id = first_computer.get("id")
                if computer_id:
                    detail_success, detail_data = self.run_test(
                        f"Computer Details (ID: {computer_id})", 
                        "GET", 
                        f"glpi/computers/{computer_id}", 
                        200,
                        expected_keys=["id", "name"]
                    )
                    if detail_success:
                        print(f"   💻 Computer: {detail_data.get('name', 'N/A')}")
                        print(f"   🔢 Serial: {detail_data.get('serial', 'N/A')}")
        
        return success

    def test_inventory_endpoints(self):
        """Test all inventory endpoints"""
        print("\n" + "="*50)
        print("TESTING INVENTORY ENDPOINTS")
        print("="*50)
        
        endpoints = [
            ("Software", "glpi/software"),
            ("Monitors", "glpi/monitors"),
            ("Printers", "glpi/printers"),
            ("Network Equipment", "glpi/network"),
            ("Phones", "glpi/phones")
        ]
        
        all_success = True
        
        for name, endpoint in endpoints:
            success, data = self.run_test(f"{name} List", "GET", endpoint, 200, expected_keys=["data", "total"])
            if success:
                items = data.get("data", [])
                total = data.get("total", 0)
                print(f"   📋 {name}: {len(items)} items (total: {total})")
            else:
                all_success = False
        
        return all_success

    def test_agent_endpoints(self):
        """Test agent configuration endpoints"""
        print("\n" + "="*50)
        print("TESTING AGENT ENDPOINTS")
        print("="*50)
        
        # Test download links
        success1, data1 = self.run_test("Agent Download Links", "GET", "glpi/agent-download", 200, 
                                       expected_keys=["windows_64bit", "windows_32bit", "instructions"])
        
        if success1:
            print(f"   🔗 64-bit link: {data1.get('windows_64bit', 'N/A')[:50]}...")
            print(f"   🔗 32-bit link: {data1.get('windows_32bit', 'N/A')[:50]}...")
            print(f"   📋 Instructions: {len(data1.get('instructions', []))} steps")
        
        # Test config generation
        config_data = {
            "server_url": "https://solutioninformatique.with32.glpi-network.cloud",
            "tag": "test-tag",
            "no_ssl_check": False,
            "debug": True,
            "force": False
        }
        
        success2, data2 = self.run_test("Agent Config Generation", "POST", "glpi/agent-config", 200, 
                                       data=config_data, expected_keys=["config", "filename"])
        
        if success2:
            config_content = data2.get("config", "")
            print(f"   📄 Config generated: {len(config_content)} characters")
            print(f"   📁 Filename: {data2.get('filename', 'N/A')}")
            
            # Verify config contains expected values
            if "https://solutioninformatique.with32.glpi-network.cloud" in config_content:
                print("   ✅ Server URL found in config")
            if "test-tag" in config_content:
                print("   ✅ Tag found in config")
        
        return success1 and success2

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting GLPI Manager Backend API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API Base: {self.api_base}")
        
        start_time = datetime.now()
        
        # Run test suites
        test_suites = [
            ("Health Endpoints", self.test_health_endpoints),
            ("GLPI Connection", self.test_glpi_connection),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Computers Endpoints", self.test_computers_endpoints),
            ("Inventory Endpoints", self.test_inventory_endpoints),
            ("Agent Endpoints", self.test_agent_endpoints)
        ]
        
        suite_results = {}
        
        for suite_name, test_func in test_suites:
            try:
                result = test_func()
                suite_results[suite_name] = result
            except Exception as e:
                print(f"\n❌ Test suite '{suite_name}' failed with error: {str(e)}")
                suite_results[suite_name] = False
        
        # Print final results
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        print(f"📊 Tests run: {self.tests_run}")
        print(f"✅ Tests passed: {self.tests_passed}")
        print(f"❌ Tests failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print(f"⏱️  Duration: {duration:.2f}s")
        
        print(f"\n📋 Test Suite Results:")
        for suite_name, result in suite_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {status} {suite_name}")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"   - {failed}")
        
        # Return exit code
        return 0 if self.tests_passed == self.tests_run else 1

def main():
    tester = GLPIBackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())