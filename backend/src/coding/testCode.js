import { executeCode } from "./jDoodle.js";

const cppCode = `
#include <iostream>
int main() {
    int x;
    std::cin >> x;
    std::cout << (x * 2);
    return 0;
}
`;

const testCases = [
  { input: "5", expectedOutput: "10" },
  { input: "0", expectedOutput: "0" },
  { input: "-3", expectedOutput: "-6" }
];

executeCode(cppCode, testCases, 'cpp')
  .then(result => console.log('C++ Input Test:', result))
  .catch(err => console.error(err));