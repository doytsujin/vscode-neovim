import { strict as assert } from "assert";

import vscode, { EndOfLine, TextEditor } from "vscode";
import diff from "fast-diff";

import { closeAllActiveEditors } from "../utils";
import { applyEditorDiffOperations, computeEditorOperationsFromDiff } from "../../utils";

describe("utils", () => {
    afterEach(async () => {
        await closeAllActiveEditors();
    });

    describe("applyEditsFromDiff()", function () {
        it("deletes at beginning", async () => {
            await assertTextChange("aaa bbb ccc", "bbb ccc");
            await assertTextChange("pineapple", "apple");
        });

        it("deletes in middle", async () => {
            await assertTextChange("aaa bbb ccc", "aaa ccc");
            await assertTextChange("abc123def", "abcdef");
        });

        it("deletes at end", async () => {
            await assertTextChange("aaa bbb ccc", "aaa bbb");
            await assertTextChange("abc123def", "abc123");
        });

        it("inserts at beginning", async () => {
            await assertTextChange("bbb ccc", "aaa bbb ccc");
            await assertTextChange("abcdef", "123abcdef");
        });

        it("inserts in middle", async () => {
            await assertTextChange("aaa ccc", "aaa bbb ccc");
            await assertTextChange("abcdef", "abc123def");
        });

        it("inserts at end", async () => {
            await assertTextChange("aaa bbb", "aaa bbb ccc");
            await assertTextChange("abcdef", "abcdef123");
        });

        it("inserts and deletes", async () => {
            await assertTextChange("yz", "xy");
        });

        it("supports complex diff", async () => {
            await assertTextChange("The round pegs in the square holes", "The ones who see things differently");
        });
    });

    async function assertTextChange(oldText: string, newText: string): Promise<void> {
        const editor = await setupEditorWithText(oldText);
        await editor.edit((builder) => {
            const editorOps = computeEditorOperationsFromDiff(diff(oldText, newText));
            applyEditorDiffOperations(builder, { editorOps, line: 0 });
        });
        assert.deepEqual(getEditorText(editor), [newText]);
    }

    async function setupEditorWithText(text: string): Promise<vscode.TextEditor> {
        const doc = await vscode.workspace.openTextDocument({
            content: [text].join("\n"),
        });
        return vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    }

    function getEditorText(editor: TextEditor): string[] {
        const text = editor.document.getText();
        const eol = editor.document.eol === EndOfLine.CRLF ? "\r\n" : "\n";
        return text.split(eol);
    }
});
