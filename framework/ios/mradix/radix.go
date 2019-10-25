/* Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

package mradix

import (
	"bytes"
)

type Tree struct {
	root *MmapNode
	data *ReaderAt
}

func NewTree(path string) (*Tree, error) {
	b, err := MmapOpen(path)
	if err != nil {
		return nil, err
	}

	t := GetRootAsMmapTree(b.data, 0)
	return &Tree{data: b, root: t.Nodes(new(MmapNode))}, nil
}

func (t *Tree) Close() error {
	return t.data.Close()
}

func (t *Tree) Get(key []byte) *MmapNode {
	node := t.root
	for len(key) != 0 {
		node, key = t.getChildNode(node, key)
		if node == nil {
			return nil
		}
	}
	return node
}

func (t *Tree) Has(key []byte) bool {
	node := t.root
	for len(key) != 0 {
		node, key = t.getChildNode(node, key)
		if node == nil {
			return false
		}
	}
	return true
}

func (t *Tree) LongestPrefix(key []byte) ([]byte, []byte, bool) {
	node := t.root
	var lastNode *MmapNode
	longest := []byte{}
	for len(key) != 0 {
		node, key = t.getChildNode(node, key)
		if node == nil {
			if lastNode == nil {
				return nil, nil, false
			} else {
				return longest, lastNode.ValueBytes(), true
			}
		} else {
			longest = append(longest, node.PrefixBytes()...)
			lastNode = node
		}
		if len(key) == 0 {
			return longest, lastNode.ValueBytes(), true
		}
	}
	return nil, nil, false
}

func (t *Tree) getChildNode(n *MmapNode, key []byte) (*MmapNode, []byte) {
	var m MmapNode
	for i := 0; i < n.ChildrenLength(); i++ {
		if !n.Children(&m, i) {
			break
		}
		pref := m.PrefixBytes()
		if hasPrefix(key, pref) {
			return &m, key[len(pref):]
		}
	}
	return nil, key
}

func hasPrefix(s, prefix []byte) bool {
	if len(prefix) == 0 {
		return len(s) == 0
	}
	return bytes.HasPrefix(s, prefix)
}
