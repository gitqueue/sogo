
/* SOGoAppointmentFolders.m - this file is part of SOGo
 *
 * Copyright (C) 2007 Inverse inc.
 *
 * Author: Wolfgang Sourdeau <wsourdeau@inverse.ca>
 *
 * This file is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2, or (at your option)
 * any later version.
 *
 * This file is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; see the file COPYING.  If not, write to
 * the Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 */

#import <Foundation/NSArray.h>
#import <Foundation/NSDictionary.h>
#import <Foundation/NSEnumerator.h>
#import <Foundation/NSString.h>

#import <NGObjWeb/WOContext.h>
#import <NGObjWeb/WORequest+So.h>
#import <NGObjWeb/NSException+HTTP.h>
#import <SaxObjC/XMLNamespaces.h>
#import <SOGo/WORequest+SOGo.h>
#import <SOGo/NSObject+DAV.h>
#import <SOGo/SOGoWebDAVValue.h>
#import "SOGoAppointmentFolder.h"

#import "SOGoAppointmentFolders.h"

@implementation SOGoAppointmentFolders

+ (NSString *) gcsFolderType
{
  return @"Appointment";
}

+ (Class) subFolderClass
{
  return [SOGoAppointmentFolder class];
}

- (NSString *) defaultFolderName
{
  return [self labelForKey: @"Personal Calendar"];
}

- (NSString *) _fetchPropertyWithName: (NSString *) propertyName
			      inArray: (NSArray *) section
{
  NSObject <DOMElement> *currentElement;
  NSString *currentName, *property;
  NSEnumerator *elements;
  NSObject <DOMNodeList> *values;

  property = nil;

  elements = [section objectEnumerator];
  while (!property && (currentElement = [elements nextObject]))
    {
      currentName = [NSString stringWithFormat: @"{%@}%@",
			      [currentElement namespaceURI],
			      [currentElement nodeName]];
      if ([currentName isEqualToString: propertyName])
	{
	  values = [currentElement childNodes];
	  if ([values length])
	    property = [[values objectAtIndex: 0] nodeValue];
	}
    }

  return property;
}

#warning this method may be useful at a higher level
#warning not all values are simple strings...
- (NSException *) _applyMkCalendarProperties: (NSArray *) properties
				    toObject: (SOGoObject *) newFolder
{
  NSEnumerator *allProperties;
  NSObject <DOMElement> *currentProperty;
  NSObject <DOMNodeList> *values;
  NSString *value, *currentName;
  SEL methodSel;

  allProperties = [properties objectEnumerator];
  while ((currentProperty = [allProperties nextObject]))
    {
      values = [currentProperty childNodes];
      if ([values length])
	{
	  value = [[values objectAtIndex: 0] nodeValue];
	  currentName = [NSString stringWithFormat: @"{%@}%@",
				  [currentProperty namespaceURI],
				  [currentProperty nodeName]];
	  methodSel = SOGoSelectorForPropertySetter (currentName);
	  if ([newFolder respondsToSelector: methodSel])
	    [newFolder performSelector: methodSel
		       withObject: value];
	}
    }

  return nil;
}

- (NSException *) davCreateCalendarCollection: (NSString *) newName
				    inContext: (id) createContext
{
  NSArray *subfolderNames, *setProperties;
  NSString *content, *newDisplayName;
  NSDictionary *properties;
  NSException *error;
  SOGoAppointmentFolder *newFolder;

  subfolderNames = [self toManyRelationshipKeys];
  if ([subfolderNames containsObject: newName])
    {
      content = [NSString stringWithFormat:
			    @"A collection named '%@' already exists.",
			  newName];
      error = [NSException exceptionWithHTTPStatus: 403
			   reason: content];
    }
  else
    {
      properties = [[createContext request]
		     davPatchedPropertiesWithTopTag: @"mkcalendar"];
      setProperties = [properties objectForKey: @"set"];
      newDisplayName = [self _fetchPropertyWithName: @"{DAV:}displayname"
			     inArray: setProperties];
      if (![newDisplayName length])
	newDisplayName = newName;
      error
	= [self newFolderWithName: newDisplayName andNameInContainer: newName];
      if (!error)
	{
	  newFolder = [self lookupName: newName
			    inContext: createContext
			    acquire: NO];
	  error = [self _applyMkCalendarProperties: setProperties
			toObject: newFolder];
	}
    }

  return error;
}

- (NSArray *) davComplianceClassesInContext: (id)_ctx
{
  NSMutableArray *classes;
  NSArray *primaryClasses;

  classes = [NSMutableArray new];
  [classes autorelease];

  primaryClasses = [super davComplianceClassesInContext: _ctx];
  if (primaryClasses)
    [classes addObjectsFromArray: primaryClasses];
  [classes addObject: @"calendar-access"];
  [classes addObject: @"calendar-schedule"];

  return classes;
}

- (SOGoWebDAVValue *) davCalendarComponentSet
{
  static SOGoWebDAVValue *componentSet = nil;
  NSMutableArray *components;

  if (!componentSet)
    {
      components = [NSMutableArray array];
      /* Totally hackish.... we use the "n1" prefix because we know our
         extensions will assign that one to ..:caldav but we really need to
         handle element attributes */
      [components addObject: [SOGoWebDAVValue
                               valueForObject: @"<n1:comp name=\"VEVENT\"/>"
                                   attributes: nil]];
      [components addObject: [SOGoWebDAVValue
                               valueForObject: @"<n1:comp name=\"VTODO\"/>"
                                   attributes: nil]];
      componentSet
        = [davElementWithContent (@"supported-calendar-component-set",
                                  XMLNS_CALDAV,
                                  components)
                                 asWebDAVValue];
      [componentSet retain];
    }

  return componentSet;
}

@end
