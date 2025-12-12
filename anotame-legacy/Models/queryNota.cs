using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Anotame.Models
{
    public class QueryNota
    {
        private readonly AnotameEntities db = new AnotameEntities();
        public int Folio()
        {
            var data = (from n in db.Nota
                        select n).ToList();
            return data.Count() + 1;
        }

        public int IdNota()
        {
            var data = (from n in db.Nota
                        select n).OrderByDescending(n => n.id).FirstOrDefault();

            return data.id;
        }
    }
}