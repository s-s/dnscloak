/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package mradix

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	flatbuffers "github.com/google/flatbuffers/go"
)

type TreeMarshal struct {
	file *os.File
	root *TreeMarshalNode
}

type TreeMarshalNode struct {
	Prefix   string
	Value    string
	Children []*TreeMarshalNode
}

func NewTreeMarshal(path string) (*TreeMarshal, error) {
	file, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	return &TreeMarshal{file: file, root: new(TreeMarshalNode)}, nil
}

func (tm *TreeMarshal) Close() error {
	b := flatbuffers.NewBuilder(0)
	_, err := tm.file.Write(tm.dump(b))
	if err != nil {
		return err
	}
	return tm.file.Close()
}

func (tm *TreeMarshal) dump(b *flatbuffers.Builder) []byte {
	nodes := tm.root.dump(b)
	MmapTreeStart(b)
	MmapTreeAddNodes(b, nodes)
	b.Finish(MmapTreeEnd(b))
	return b.FinishedBytes()
}

func (n *TreeMarshalNode) dump(b *flatbuffers.Builder) flatbuffers.UOffsetT {
	offs := make([]flatbuffers.UOffsetT, len(n.Children))
	for i, nv := range n.Children {
		offs[i] = nv.dump(b)
	}
	MmapNodeStartChildrenVector(b, len(n.Children))
	for i := len(offs) - 1; i >= 0; i-- {
		b.PrependUOffsetT(offs[i])
	}
	children := b.EndVector(len(n.Children))
	pf := b.CreateString(n.Prefix)
	v := b.CreateString(n.Value)

	MmapNodeStart(b)
	MmapNodeAddPrefix(b, pf)
	MmapNodeAddValue(b, v)
	MmapNodeAddChildren(b, children)
	return MmapNodeEnd(b)
}

func (tm *TreeMarshal) Insert(key string, val string) {
	n, match, key := tm.root.find(key)

	if len(key) == 0 {
		return
	}

	if match == 0 {
		n.Children = append(n.Children, &TreeMarshalNode{Prefix: key, Value: val})
		return
	}

	common := n.Prefix[:match]
	child := &TreeMarshalNode{
		Prefix:   strings.TrimPrefix(n.Prefix, common),
		Value:    n.Value,
		Children: n.Children,
	}
	n.Children = []*TreeMarshalNode{&TreeMarshalNode{Prefix: strings.TrimPrefix(key, common), Value: val}, child}
	n.Prefix = common
	n.Value = ""
}

func (n *TreeMarshalNode) PrintJSON() {
	j, err := json.MarshalIndent(n, "  ", "    ")
	if err != nil {
		panic(err)
	}
	fmt.Printf("%s\n\n", j)
}

func (n *TreeMarshalNode) find(key string) (*TreeMarshalNode, int, string) {
	for _, nv := range n.Children {
		pl := prefixLen(key, nv.Prefix)
		if pl == 0 {
			continue
		}

		if pl < len(nv.Prefix) {
			return nv, pl, key
		}

		return nv.find(key[pl:])
	}
	return n, 0, key
}

func prefixLen(s, prefix string) (n int) {
	min := len(prefix)
	if len(s) < len(prefix) {
		min = len(s)
	}
	for n < min && s[n] == prefix[n] {
		n++
	}
	return n
}
